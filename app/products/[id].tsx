import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingBag, ShoppingCart, MapPin, Truck, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { ProductService, Product } from '@/src/features/products/services/product.service';
import { OrderService, CreateOrderInput } from '@/src/features/products/services/order.service';
import { ReviewsList } from '@/src/features/reviews/components/ReviewsList';
import { colors } from '@/src/theme/colors';
import { supabase } from '@/lib/supabase';
import { PaymentMethodSelector } from '@/src/components/PaymentMethodSelector';
import { PaymentMethodConfig } from '@/src/features/payment/services/paymentMethods.service';
import { CurrencyConverter } from '@/src/utils/currency';
import { MoreOptionsMenu } from '@/src/components/MoreOptionsMenu';
import { PayOSPaymentModal } from '@/src/components/PayOSPaymentModal';
import { PayOSService, PayOSPaymentRequest } from '@/src/features/payment/services/payos.service';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodConfig | null>(null);
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [payosRequest, setPayosRequest] = useState<PayOSPaymentRequest | null>(null);

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
  });

  useEffect(() => {
    if (id) {
      loadProduct();

      // Subscribe to realtime updates for product
      const productChannel = supabase
        .channel(`product-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'products',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            const updatedProduct = payload.new as Product;
            setProduct((prev) => (prev ? { ...prev, ...updatedProduct } : null));
          }
        )
        .subscribe();

      return () => {
        productChannel.unsubscribe();
      };
    }
  }, [id]);

  // Auto-fill shipping info from profile
  useEffect(() => {
    if (profile) {
      const extendedProfile = profile as any; // Temporary type assertion
      setShippingInfo({
        name: extendedProfile.shipping_name || profile.full_name || '',
        phone: extendedProfile.shipping_phone || extendedProfile.phone || '',
        address: extendedProfile.shipping_address || '',
        city: extendedProfile.shipping_city || '',
        district: extendedProfile.shipping_district || '',
        ward: extendedProfile.shipping_ward || '',
        note: '',
      });
    }
  }, [profile]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getById(id!);
      if (data) {
        setProduct(data);
        // Increment views
        ProductService.incrementViews(data.id).catch(console.error);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy sản phẩm', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Error loading product:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (!user?.id) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để mua hàng');
      return;
    }

    if (!product?.is_available) {
      Alert.alert('Thông báo', 'Sản phẩm hiện không có sẵn');
      return;
    }

    if (product.stock_quantity < quantity) {
      Alert.alert('Thông báo', `Chỉ còn ${product.stock_quantity} sản phẩm trong kho`);
      return;
    }

    setShowCheckout(true);
  };

  const handleOrder = async () => {
    if (!user?.id || !product) return;

    // Validate shipping info
    if (!shippingInfo.name.trim() || !shippingInfo.phone.trim() || !shippingInfo.address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    try {
      setOrdering(true);

      if (!selectedPaymentMethod) {
        Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán');
        return;
      }

      // Nếu chọn PayOS, hiển thị PayOS modal
      if (selectedPaymentMethod.id === 'payos') {
        const payosRequest: PayOSPaymentRequest = {
          orderCode: PayOSService.generateOrderCode(),
          amount: PayOSService.formatAmount(finalPrice),
          description: `Thanh toán đơn hàng ${product.name}`,
          buyerName: shippingInfo.name,
          buyerPhone: shippingInfo.phone,
          buyerAddress: shippingInfo.address,
          items: [
            {
              name: product.name,
              quantity: quantity,
              price: PayOSService.formatAmount(product.price),
            },
          ],
        };

        setPayosRequest(payosRequest);
        setShowPayOSModal(true);
        setOrdering(false);
        return;
      }

      // Xử lý các payment method khác (COD, bank transfer)
      const orderInput: CreateOrderInput = {
        product_id: product.id,
        quantity,
        shipping_name: shippingInfo.name,
        shipping_phone: shippingInfo.phone,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city || undefined,
        shipping_district: shippingInfo.district || undefined,
        shipping_ward: shippingInfo.ward || undefined,
        shipping_note: shippingInfo.note || undefined,
        payment_method: selectedPaymentMethod.id as any,
      };

      await OrderService.create(orderInput, user.id);

      Alert.alert(
        'Thành công! 🎉',
        'Đơn hàng của bạn đã được tạo thành công. Seller sẽ xác nhận đơn hàng sớm nhất có thể.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCheckout(false);
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo đơn hàng');
    } finally {
      setOrdering(false);
    }
  };

  const formatPrice = (price: number) => {
    return CurrencyConverter.format(price, 'VND');
  };

  const handlePayOSSuccess = async (transactionData: any) => {
    try {
      setOrdering(true);
      
      // Tạo order với payment đã được xác nhận
      const orderInput: CreateOrderInput = {
        product_id: product!.id,
        quantity,
        shipping_name: shippingInfo.name,
        shipping_phone: shippingInfo.phone,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city || undefined,
        shipping_district: shippingInfo.district || undefined,
        shipping_ward: shippingInfo.ward || undefined,
        shipping_note: shippingInfo.note || undefined,
        payment_method: 'payos' as any,
        payment_transaction_id: transactionData.paymentLinkId,
      };

      await OrderService.create(orderInput, user!.id);
      
      setShowPayOSModal(false);
      setShowCheckout(false);
      
      Alert.alert(
        'Thanh toán thành công! 🎉',
        'Đơn hàng của bạn đã được thanh toán và tạo thành công.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating order after payment:', error);
      Alert.alert('Lỗi', 'Thanh toán thành công nhưng không thể tạo đơn hàng. Vui lòng liên hệ hỗ trợ.');
    } finally {
      setOrdering(false);
    }
  };

  const handlePayOSError = (error: string) => {
    setShowPayOSModal(false);
    Alert.alert('Lỗi thanh toán', error);
  };

  const handlePayOSClose = () => {
    setShowPayOSModal(false);
  };

  const hasDiscount = product?.original_price && product.original_price > product.price;
  const totalPrice = product ? product.price * quantity : 0;
  const finalPrice = totalPrice + (product?.shipping_fee || 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
          {product && (
            <MoreOptionsMenu
              targetType="product"
              targetId={product.id}
              targetName={product.name}
              showReport={true}
            />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Product Image */}
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <ShoppingBag size={64} color="#ccc" />
          </View>
        )}

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{product.name}</Text>
            {!product.is_available && (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Hết hàng</Text>
              </View>
            )}
          </View>

          {product.category && (
            <Text style={styles.category}>{product.category.name}</Text>
          )}

          <View style={styles.priceContainer}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.original_price!)}
              </Text>
            )}
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Số lượng tồn kho:</Text>
              <Text style={styles.detailValue}>{product.stock_quantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Đã bán:</Text>
              <Text style={styles.detailValue}>{product.sales_count}</Text>
            </View>
            <View style={styles.detailRow}>
              <Truck size={16} color="#666" />
              <Text style={styles.detailLabel}>Phí vận chuyển:</Text>
              <Text style={styles.detailValue}>
                {formatPrice(product.shipping_fee)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#666" />
              <Text style={styles.detailLabel}>Giao hàng trong:</Text>
              <Text style={styles.detailValue}>
                {product.estimated_delivery_days} ngày
              </Text>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <ReviewsList productId={product.id} />
      </ScrollView>

      {/* Bottom Bar */}
      {product.is_available && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Số lượng:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  setQuantity(Math.min(product.stock_quantity, quantity + 1))
                }
                disabled={quantity >= product.stock_quantity}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={handleBuy}
            disabled={product.stock_quantity === 0}
          >
            <ShoppingCart size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buyButtonText}>
              Mua ngay - {formatPrice(finalPrice)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCheckout(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity
                onPress={() => setShowCheckout(false)}
                style={styles.modalBackButton}
              >
                <ArrowLeft size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Đặt hàng</Text>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalScrollView}>
            {/* Product Summary */}
            <View style={styles.checkoutSection}>
              <Text style={styles.checkoutSectionTitle}>Sản phẩm</Text>
              <View style={styles.checkoutProductRow}>
                {product.image_url && (
                  <Image
                    source={{ uri: product.image_url }}
                    style={styles.checkoutProductImage}
                  />
                )}
                <View style={styles.checkoutProductInfo}>
                  <Text style={styles.checkoutProductName}>{product.name}</Text>
                  <Text style={styles.checkoutProductPrice}>
                    {formatPrice(product.price)} x {quantity}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.checkoutSection}>
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod?.id}
                onSelect={setSelectedPaymentMethod}
                disabled={ordering}
              />
            </View>

            {/* Shipping Info */}
            <View style={styles.checkoutSection}>
              <Text style={styles.checkoutSectionTitle}>Thông tin giao hàng</Text>
              {(profile as any)?.shipping_name && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F0F8FF',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  gap: 8,
                }}>
                  <Check size={16} color={colors.primary} />
                  <Text style={{
                    fontSize: 14,
                    color: colors.primary,
                    flex: 1,
                  }}>
                    Thông tin đã được tự động điền từ hồ sơ của bạn
                  </Text>
                </View>
              )}
              <TextInput
                style={styles.checkoutInput}
                placeholder="Họ và tên *"
                value={shippingInfo.name}
                onChangeText={(text) =>
                  setShippingInfo({ ...shippingInfo, name: text })
                }
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Số điện thoại *"
                value={shippingInfo.phone}
                onChangeText={(text) =>
                  setShippingInfo({ ...shippingInfo, phone: text })
                }
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.checkoutInput, styles.checkoutTextArea]}
                placeholder="Địa chỉ *"
                value={shippingInfo.address}
                onChangeText={(text) =>
                  setShippingInfo({ ...shippingInfo, address: text })
                }
                multiline
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Thành phố"
                value={shippingInfo.city}
                onChangeText={(text) =>
                  setShippingInfo({ ...shippingInfo, city: text })
                }
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Quận/Huyện"
                value={shippingInfo.district}
                onChangeText={(text) =>
                  setShippingInfo({ ...shippingInfo, district: text })
                }
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Phường/Xã"
                value={shippingInfo.ward}
                onChangeText={(text) =>
                  setShippingInfo({ ...shippingInfo, ward: text })
                }
              />
              <TextInput
                style={[styles.checkoutInput, styles.checkoutTextArea]}
                placeholder="Ghi chú (tùy chọn)"
                value={shippingInfo.note}
                onChangeText={(text) =>
                  setShippingInfo({ ...shippingInfo, note: text })
                }
                multiline
              />
            </View>

            {/* Order Summary */}
            <View style={styles.checkoutSection}>
              <Text style={styles.checkoutSectionTitle}>Tổng đơn hàng</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính:</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(totalPrice)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(product.shipping_fee)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Tổng cộng:</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatPrice(finalPrice)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.orderButton, ordering && styles.orderButtonDisabled]}
              onPress={handleOrder}
              disabled={ordering}
            >
              {ordering ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.orderButtonText}>Đặt hàng</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PayOS Payment Modal */}
      {payosRequest && (
        <PayOSPaymentModal
          visible={showPayOSModal}
          onClose={handlePayOSClose}
          onSuccess={handlePayOSSuccess}
          onError={handlePayOSError}
          paymentRequest={payosRequest}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  productImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  unavailableBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  category: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  descriptionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E4E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  detailsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E4E7EB',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  buyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalScrollView: {
    flex: 1,
  },
  checkoutSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  checkoutSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  checkoutProductRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checkoutProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  checkoutProductInfo: {
    flex: 1,
  },
  checkoutProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  checkoutProductPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  checkoutInput: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E4E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  checkoutTextArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7EB',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  modalFooter: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E7EB',
    padding: 16,
  },
  orderButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonDisabled: {
    backgroundColor: '#D4D6DC',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});