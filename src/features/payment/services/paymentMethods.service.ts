import { supabase } from '@/lib/supabase';

export type PaymentMethod = 'payos' | 'momo' | 'zalopay' | 'bank_transfer' | 'cod' | 'e_wallet';

export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'payos',
    name: 'PayOS',
    icon: '💳',
    enabled: true,
    description: 'Thanh toán qua PayOS',
  },
  {
    id: 'momo',
    name: 'MoMo',
    icon: '📱',
    enabled: false,
    description: 'Thanh toán qua ví MoMo',
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    icon: '💸',
    enabled: false,
    description: 'Thanh toán qua ZaloPay',
  },
  {
    id: 'e_wallet',
    name: 'Ví điện tử',
    icon: '💰',
    enabled: true,
    description: 'Thanh toán qua ví điện tử',
  },
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản',
    icon: '🏦',
    enabled: true,
    description: 'Chuyển khoản ngân hàng',
  },
  {
    id: 'cod',
    name: 'COD',
    icon: '💰',
    enabled: true,
    description: 'Thanh toán khi nhận hàng',
  },
];

// Map payment method IDs to database values
export const mapPaymentMethodToDb = (methodId: PaymentMethod): 'cod' | 'bank_transfer' | 'e_wallet' | 'payos' | 'momo' | 'zalopay' => {
  switch (methodId) {
    case 'payos':
    case 'momo':
    case 'zalopay':
      return methodId; // Sử dụng trực tiếp sau khi update constraint
    case 'bank_transfer':
    case 'cod':
    case 'e_wallet':
      return methodId;
    default:
      return 'cod'; // fallback
  }
};

export const PaymentMethodsService = {
  async getAvailableMethods(): Promise<PaymentMethodConfig[]> {
    return PAYMENT_METHODS.filter((method) => method.enabled);
  },

  async getUserPreferredMethod(userId: string): Promise<PaymentMethod | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferred_payment_method')
      .eq('user_id', userId)
      .single();

    if (error || !data) return 'payos';
    return (data.preferred_payment_method as PaymentMethod) || 'payos';
  },

  async setUserPreferredMethod(userId: string, method: PaymentMethod): Promise<void> {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferred_payment_method: method,
        updated_at: new Date().toISOString(),
      });
  },
};

