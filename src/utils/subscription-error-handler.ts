/**
 * Subscription Error Handler
 * Xử lý và log các lỗi subscription một cách có hệ thống
 */

import { supabase } from '@/lib/supabase';

export interface SubscriptionError {
  type: 'creation_failed' | 'payment_failed' | 'activation_failed' | 'update_failed' | 'validation_error';
  message: string;
  code?: string;
  details?: any;
  userId?: string;
  subscriptionId?: string;
}

class SubscriptionErrorHandler {
  /**
   * Log subscription error to database
   */
  async logError(error: SubscriptionError): Promise<string | null> {
    try {
      const { data, error: logError } = await supabase.rpc('log_subscription_error', {
        user_id_param: error.userId || null,
        subscription_id_param: error.subscriptionId || null,
        error_type_param: error.type,
        error_message_param: error.message,
        error_code_param: error.code || null,
        error_details_param: error.details ? JSON.stringify(error.details) : null,
      });

      if (logError) {
        console.error('Failed to log subscription error:', logError);
        return null;
      }

      return data || null;
    } catch (err) {
      console.error('Error logging subscription error:', err);
      return null;
    }
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: SubscriptionError): string {
    switch (error.type) {
      case 'creation_failed':
        return 'Không thể tạo subscription. Vui lòng thử lại sau.';
      case 'payment_failed':
        return 'Thanh toán thất bại. Vui lòng kiểm tra lại thông tin thanh toán.';
      case 'activation_failed':
        return 'Không thể kích hoạt subscription. Vui lòng liên hệ hỗ trợ.';
      case 'update_failed':
        return 'Không thể cập nhật subscription. Vui lòng thử lại.';
      case 'validation_error':
        return error.message || 'Dữ liệu không hợp lệ.';
      default:
        return error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: SubscriptionError): boolean {
    // Don't retry on validation errors or unique constraint violations
    if (error.type === 'validation_error' || error.code === '23505') {
      return false;
    }

    // Retry on network errors, timeouts, or temporary failures
    return true;
  }

  /**
   * Handle error with logging and user-friendly message
   */
  async handleError(
    error: any,
    type: SubscriptionError['type'],
    userId?: string,
    subscriptionId?: string
  ): Promise<string> {
    const subscriptionError: SubscriptionError = {
      type,
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error,
      userId,
      subscriptionId,
    };

    // Log error
    await this.logError(subscriptionError);

    // Return user-friendly message
    return this.getErrorMessage(subscriptionError);
  }
}

export const subscriptionErrorHandler = new SubscriptionErrorHandler();

