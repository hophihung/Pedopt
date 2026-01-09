import { supabase } from '@/lib/supabase';

export interface SellerAnalytics {
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_commission_paid: number;
  pending_payouts: number;
  completed_payouts: number;
  average_order_value: number;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  top_products: Array<{ id: string; name: string; sales: number; revenue: number }>;
}

export const SellerAnalyticsService = {
  async getSellerAnalytics(sellerId: string): Promise<SellerAnalytics | null> {
    try {
      // Get total revenue from completed orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, final_price, status, created_at, escrow_account_id')
        .eq('seller_id', sellerId);

      if (ordersError) throw ordersError;

      const completedOrders = orders.filter((o) => o.status === 'delivered');
      const pendingOrders = orders.filter(
        (o) => !['delivered', 'cancelled'].includes(o.status)
      );

      const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.final_price || '0'), 0);
      const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // Get commission paid
      const escrowAccountIds = completedOrders
        .map((o) => o.escrow_account_id)
        .filter(Boolean) as string[];
      
      const { data: commissions, error: commissionsError } = await supabase
        .from('platform_commissions')
        .select('total_platform_fee, status')
        .eq('status', 'collected')
        .in('escrow_account_id', escrowAccountIds);

      const totalCommissionPaid =
        commissions?.reduce((sum, c) => sum + parseFloat(c.total_platform_fee || '0'), 0) || 0;

      // Get payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('payout_records')
        .select('amount, status')
        .eq('seller_id', sellerId);

      const pendingPayouts =
        payouts?.filter((p) => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;
      const completedPayouts =
        payouts?.filter((p) => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;

      // Revenue by month (last 6 months)
      const revenueByMonth = this.calculateRevenueByMonth(completedOrders);

      // Top products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('seller_id', sellerId);

      const topProducts = await this.getTopProducts(sellerId, products || []);

      return {
        total_revenue: totalRevenue,
        total_orders: orders.length,
        completed_orders: completedOrders.length,
        pending_orders: pendingOrders.length,
        total_commission_paid: totalCommissionPaid,
        pending_payouts: pendingPayouts,
        completed_payouts: completedPayouts,
        average_order_value: averageOrderValue,
        revenue_by_month: revenueByMonth,
        top_products: topProducts,
      };
    } catch (error) {
      console.error('Error getting seller analytics:', error);
      return null;
    }
  },

  calculateRevenueByMonth(orders: any[]): Array<{ month: string; revenue: number }> {
    const last6Months: Array<{ month: string; revenue: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });

      const monthOrders = orders.filter((o) => {
        const orderDate = new Date(o.created_at);
        return (
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
        );
      });

      const revenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.final_price || '0'), 0);
      last6Months.push({ month: monthKey, revenue });
    }

    return last6Months;
  },

  async getTopProducts(sellerId: string, products: any[]): Promise<Array<{ id: string; name: string; sales: number; revenue: number }>> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('product_id, quantity, final_price')
      .eq('seller_id', sellerId)
      .eq('status', 'delivered');

    if (error) return [];

    const productStats = new Map<string, { sales: number; revenue: number }>();

    orders?.forEach((order) => {
      const productId = order.product_id;
      const existing = productStats.get(productId) || { sales: 0, revenue: 0 };
      productStats.set(productId, {
        sales: existing.sales + (order.quantity || 1),
        revenue: existing.revenue + parseFloat(order.final_price || '0'),
      });
    });

    return Array.from(productStats.entries())
      .map(([id, stats]) => {
        const product = products.find((p) => p.id === id);
        return {
          id,
          name: product?.name || 'Unknown',
          sales: stats.sales,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  },
};

