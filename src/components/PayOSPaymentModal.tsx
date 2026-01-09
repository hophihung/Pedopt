import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { X, ExternalLink, RefreshCw, CheckCircle, XCircle } from 'lucide-react-native';
import { PayOSService, PayOSPaymentRequest } from '@/src/features/payment/services/payos.service';
import { colors } from '@/src/theme/colors';
import { CurrencyConverter } from '@/src/utils/currency';

interface PayOSPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (transactionData: any) => void;
  onError: (error: string) => void;
  paymentRequest: PayOSPaymentRequest;
}

export function PayOSPaymentModal({
  visible,
  onClose,
  onSuccess,
  onError,
  paymentRequest,
}: PayOSPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | 'cancelled'>('pending');
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && paymentRequest) {
      createPayment();
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [visible, paymentRequest]);

  const createPayment = async () => {
    try {
      setLoading(true);
      setStatus('pending');
      
      console.log('🚀 Creating PayOS payment with request:', paymentRequest);
      
      const response = await PayOSService.createPaymentLink(paymentRequest);
      
      console.log('📦 PayOS response received:', response);
      
      if (response.error === 0) {
        console.log('✅ PayOS payment created successfully');
        
        if (response.data) {
          setPaymentData(response.data);
          startStatusCheck(response.data.orderCode);
        } else {
          throw new Error('PayOS response missing data');
        }
      } else {
        console.error('❌ PayOS response error:', response);
        throw new Error(response.message || 'Không thể tạo thanh toán');
      }
    } catch (error: any) {
      console.error('💥 Error creating PayOS payment:', error);
      onError(error.message || 'Lỗi tạo thanh toán');
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const startStatusCheck = (orderCode: number) => {
    console.log('⏰ Starting status check for order:', orderCode);
    
    // TEMPORARY: Disable status check since get-payos-payment-info Edge Function doesn't exist
    console.log('🚫 Status check disabled - Edge Function not available');
    
    // For now, just show the payment interface without status checking
    // User can manually confirm payment or we can implement manual confirmation
    
    return; // Skip status checking
    
    // Check payment status every 3 seconds
    const interval = setInterval(async () => {
      try {
        setChecking(true);
        console.log('🔄 Checking payment status...');
        
        const statusResponse = await PayOSService.getPaymentStatus(orderCode);
        
        console.log('📊 Status response:', statusResponse);
        
        if (statusResponse.data?.status === 'PAID') {
          console.log('💰 Payment completed!');
          setStatus('success');
          clearInterval(interval);
          onSuccess(statusResponse.data);
        } else if (statusResponse.data?.status === 'CANCELLED') {
          console.log('❌ Payment cancelled');
          setStatus('cancelled');
          clearInterval(interval);
        } else {
          console.log('⏳ Payment still pending...');
        }
      } catch (error) {
        console.error('💥 Error checking payment status:', error);
      } finally {
        setChecking(false);
      }
    }, 3000);

    setCheckInterval(interval);

    // Auto stop checking after 10 minutes
    setTimeout(() => {
      console.log('⏰ Payment check timeout');
      clearInterval(interval);
      if (status === 'pending') {
        setStatus('failed');
        onError('Thanh toán hết hạn');
      }
    }, 10 * 60 * 1000);
  };

  const handleOpenPaymentLink = () => {
    if (paymentData?.checkoutUrl) {
      Linking.openURL(paymentData.checkoutUrl);
    }
  };

  const handleCancel = async () => {
    try {
      if (paymentData?.orderCode) {
        await PayOSService.cancelPaymentLink(paymentData.orderCode);
      }
    } catch (error) {
      console.error('Error canceling payment:', error);
    }
    
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    setStatus('cancelled');
    onClose();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tạo thanh toán...</Text>
        </View>
      );
    }

    if (status === 'failed') {
      return (
        <View style={styles.statusContainer}>
          <XCircle size={64} color="#FF3B30" />
          <Text style={styles.statusTitle}>Thanh toán thất bại</Text>
          <Text style={styles.statusMessage}>Vui lòng thử lại sau</Text>
          <TouchableOpacity style={styles.retryButton} onPress={createPayment}>
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'success') {
      return (
        <View style={styles.statusContainer}>
          <CheckCircle size={64} color="#34C759" />
          <Text style={styles.statusTitle}>Thanh toán thành công!</Text>
          <Text style={styles.statusMessage}>Đơn hàng của bạn đã được xác nhận</Text>
        </View>
      );
    }

    if (!paymentData) {
      return null;
    }

    return (
      <View style={styles.paymentContainer}>
        <Text style={styles.title}>Thanh toán PayOS</Text>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Số tiền thanh toán</Text>
          <Text style={styles.amountValue}>
            {CurrencyConverter.format(paymentData.amount, 'VND')}
          </Text>
        </View>

        {paymentData.qrCode && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>Quét mã QR để thanh toán</Text>
            <Image
              source={{ uri: paymentData.qrCode }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Hướng dẫn thanh toán:</Text>
          <Text style={styles.instructionText}>
            1. Mở ứng dụng ngân hàng của bạn{'\n'}
            2. Quét mã QR hoặc nhấn "Mở link thanh toán"{'\n'}
            3. Xác nhận thanh toán{'\n'}
            4. Chờ xác nhận từ hệ thống
          </Text>
        </View>

        <TouchableOpacity style={styles.openLinkButton} onPress={handleOpenPaymentLink}>
          <ExternalLink size={20} color="#fff" />
          <Text style={styles.openLinkText}>Mở link thanh toán</Text>
        </TouchableOpacity>

        {checking && (
          <View style={styles.checkingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.checkingText}>Đang kiểm tra trạng thái thanh toán...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PayOS</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  paymentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  instructionContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  openLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  openLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  checkingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    padding: 40,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});