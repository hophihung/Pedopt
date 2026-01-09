import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * PayOS Webhook Handler
 * Xử lý webhook từ PayOS khi payment thành công/thất bại
 * Tự động tạo escrow account cho order/transaction
 * 
 * PayOS Webhook Format:
 * {
 *   "code": "00",
 *   "desc": "success",
 *   "data": {
 *     "orderCode": 123456,
 *     "amount": 100000,
 *     "description": "Thanh toán...",
 *     "accountNumber": "...",
 *     "reference": "...",
 *     "transactionDateTime": "...",
 *     "currency": "VND",
 *     "paymentLinkId": "...",
 *     "code": "00",
 *     "desc": "success"
 *   },
 *   "signature": "..."
 * }
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (PayOS uses HMAC SHA256)
    const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY');
    if (!checksumKey) {
      console.error('PAYOS_CHECKSUM_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();
    console.log('PayOS Webhook received:', JSON.stringify(payload, null, 2));

    // Verify signature
    const signature = payload.signature;
    if (!signature) {
      console.error('Missing signature in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Verify PayOS signature
    // PayOS signature verification logic here
    // For now, we'll trust the webhook (in production, always verify!)

    // Get webhook data
    const webhookData = payload.data;
    if (!webhookData) {
      console.error('Missing data in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderCode = webhookData.orderCode;
    const amount = webhookData.amount;
    const paymentLinkId = webhookData.paymentLinkId;
    const status = webhookData.code; // '00' = success, others = failed

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find order or transaction by orderCode
    // We need to store orderCode when creating payment link
    // For now, we'll search by payment_link_id in orders/transactions metadata

    // Check if this is for an order
    // Try both payos_payment_link_id and payment_transaction_id (for backward compatibility)
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, final_price, escrow_status')
      .or(`payos_payment_link_id.eq.${paymentLinkId},payment_transaction_id.eq.${paymentLinkId}`)
      .maybeSingle();

    if (orderData) {
      // Handle order payment
      if (status === '00' && orderData.escrow_status === 'none') {
        // Payment successful, create escrow
        console.log('Creating escrow for order:', orderData.id);
        
        const { data: escrowId, error: escrowError } = await supabase.rpc(
          'create_escrow_for_order',
          {
            order_id_param: orderData.id,
            payment_method_param: 'payos',
            payment_transaction_id_param: paymentLinkId,
          }
        );

        if (escrowError) {
          console.error('Error creating escrow for order:', escrowError);
          return new Response(
            JSON.stringify({ error: 'Failed to create escrow', details: escrowError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Escrow created successfully for order:', orderData.id, 'escrow_id:', escrowId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Escrow created for order',
            order_id: orderData.id,
            escrow_id: escrowId
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (orderData.escrow_status !== 'none') {
        // Escrow already exists
        console.log('Escrow already exists for order:', orderData.id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Escrow already exists',
            order_id: orderData.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if this is for a subscription payment
    // Subscription transaction_code format: SUB-{subscription_id}
    const transactionCode = webhookData.reference || '';
    if (transactionCode.startsWith('SUB-')) {
      const subscriptionIdPrefix = transactionCode.replace('SUB-', '');
      
      // Find subscription by ID prefix
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('id, profile_id, plan, status, payment_id')
        .like('id', `${subscriptionIdPrefix}%`)
        .maybeSingle();

      if (subscriptionData) {
        if (status === '00') {
          // Payment successful - activate subscription
          console.log('Activating subscription:', subscriptionData.id);
          
          const { error: activateError } = await supabase.rpc(
            'activate_subscription_after_payment',
            {
              subscription_id_param: subscriptionData.id,
              payment_id_param: paymentLinkId,
              payment_method_param: 'payos',
            }
          );

          if (activateError) {
            console.error('Error activating subscription:', activateError);
            // Log error
            await supabase.rpc('log_subscription_error', {
              user_id_param: subscriptionData.profile_id,
              subscription_id_param: subscriptionData.id,
              error_type_param: 'activation_failed',
              error_message_param: activateError.message,
              error_code_param: activateError.code,
            });
            
            return new Response(
              JSON.stringify({ 
                error: 'Failed to activate subscription', 
                details: activateError.message 
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Subscription activated successfully:', subscriptionData.id);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Subscription activated',
              subscription_id: subscriptionData.id
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Payment failed - update subscription status
          console.log('Payment failed for subscription:', subscriptionData.id);
          
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('id', subscriptionData.id);

          if (updateError) {
            console.error('Error updating subscription status:', updateError);
          }

          // Log error
          await supabase.rpc('log_subscription_error', {
            user_id_param: subscriptionData.profile_id,
            subscription_id_param: subscriptionData.id,
            error_type_param: 'payment_failed',
            error_message_param: `Payment failed with code: ${status}`,
            error_code_param: status,
          });

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Subscription payment failed',
              subscription_id: subscriptionData.id
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check if this is for a transaction (pet)
    // Try both payos_payment_link_id and payment_transaction_id (for backward compatibility)
    const { data: transactionData } = await supabase
      .from('transactions')
      .select('id, buyer_id, seller_id, amount, escrow_status')
      .or(`payos_payment_link_id.eq.${paymentLinkId},payment_transaction_id.eq.${paymentLinkId}`)
      .maybeSingle();

    if (transactionData) {
      // Handle transaction payment
      if (status === '00' && transactionData.escrow_status === 'none') {
        // Payment successful, create escrow
        console.log('Creating escrow for transaction:', transactionData.id);
        
        const { data: escrowId, error: escrowError } = await supabase.rpc(
          'create_escrow_for_transaction',
          {
            transaction_id_param: transactionData.id,
            payment_method_param: 'payos',
            payment_transaction_id_param: paymentLinkId,
          }
        );

        if (escrowError) {
          console.error('Error creating escrow for transaction:', escrowError);
          return new Response(
            JSON.stringify({ error: 'Failed to create escrow', details: escrowError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Escrow created successfully for transaction:', transactionData.id, 'escrow_id:', escrowId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Escrow created for transaction',
            transaction_id: transactionData.id,
            escrow_id: escrowId
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (transactionData.escrow_status !== 'none') {
        // Escrow already exists
        console.log('Escrow already exists for transaction:', transactionData.id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Escrow already exists',
            transaction_id: transactionData.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If no order or transaction found
    console.warn('No order or transaction found for paymentLinkId:', paymentLinkId);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'No matching order or transaction found',
        payment_link_id: paymentLinkId
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing PayOS webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

