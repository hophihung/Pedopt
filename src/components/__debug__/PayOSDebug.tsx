import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { PayOSPaymentModal } from '../PayOSPaymentModal';
import { PayOSService, PayOSPaymentRequest } from '@/src/features/payment/services/payos.service';
import { colors } from '@/src/theme/colors';

export function PayOSDebug() {
  const [showModal, setShowModal] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PayOSPaymentRequest | null>(null);

  const createTestPayment = () => {
    const request: PayOSPaymentRequest = {
      orderCode: PayOSService.generateOrderCode(),
      amount: PayOSService.formatAmount(150000), // 150,000 VND
      description: 'Test payment for debugging',
      buyerName: 'Test User',
      buyerPhone: '0123456789',
      buyerAddress: 'Test Address',
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          price: PayOSService.formatAmount(150000),
        },
      ],
    };

    console.log('🧪 Debug PayOS Request:', request);
    setPaymentRequest(request);
    setShowModal(true);
  };

  const handleSuccess = (transactionData: any) => {
    console.log('✅ PayOS Success:', transactionData);
    Alert.alert('Success', 'Payment completed successfully!');
    setShowModal(false);
  };

  const handleError = (error: string) => {
    console.log('❌ PayOS Error:', error);
    Alert.alert('Error', error);
    setShowModal(false);
  };

  const handleClose = () => {
    console.log('🚪 PayOS Modal Closed');
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PayOS Debug Panel</Text>
      
      <TouchableOpacity style={styles.button} onPress={createTestPayment}>
        <Text style={styles.buttonText}>Test PayOS Payment</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Test Info:</Text>
        <Text style={styles.infoText}>• Amount: 150,000 VND</Text>
        <Text style={styles.infoText}>• Product: Test Product</Text>
        <Text style={styles.infoText}>• Buyer: Test User</Text>
      </View>

      {paymentRequest && (
        <PayOSPaymentModal
          visible={showModal}
          onClose={handleClose}
          onSuccess={handleSuccess}
          onError={handleError}
          paymentRequest={paymentRequest}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});