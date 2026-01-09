import { PayOSService } from '../payos.service';

// Test PayOS Service functions
describe('PayOSService', () => {
  test('generateOrderCode should return valid number', () => {
    const orderCode = PayOSService.generateOrderCode();
    
    expect(typeof orderCode).toBe('number');
    expect(orderCode.toString().length).toBeLessThanOrEqual(9);
    expect(orderCode).toBeGreaterThan(0);
  });

  test('formatAmount should format correctly', () => {
    expect(PayOSService.formatAmount(100.5)).toBe(101);
    expect(PayOSService.formatAmount(100.4)).toBe(100);
    expect(PayOSService.formatAmount(0)).toBe(0);
  });

  test('generateOrderCode should be unique', () => {
    const code1 = PayOSService.generateOrderCode();
    const code2 = PayOSService.generateOrderCode();
    
    expect(code1).not.toBe(code2);
  });
});

// Manual test function (can be called in console)
export const testPayOSIntegration = () => {
  console.log('=== PayOS Integration Test ===');
  
  // Test 1: Generate Order Code
  const orderCode = PayOSService.generateOrderCode();
  console.log('✓ Order Code:', orderCode);
  
  // Test 2: Format Amount
  const amount = PayOSService.formatAmount(150000.75);
  console.log('✓ Formatted Amount:', amount);
  
  // Test 3: Create Payment Request (mock)
  const mockRequest = {
    orderCode,
    amount,
    description: 'Test payment',
    buyerName: 'Test User',
    buyerPhone: '0123456789',
    items: [
      {
        name: 'Test Product',
        quantity: 1,
        price: amount,
      },
    ],
  };
  console.log('✓ Mock Payment Request:', mockRequest);
  
  console.log('=== Test Completed ===');
  return { orderCode, amount, mockRequest };
};