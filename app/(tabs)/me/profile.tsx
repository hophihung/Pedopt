import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings,
  Edit,
  Heart,
  MessageCircle,
  Star,
  User,
  Bell,
  Calendar,
  Shield,
  Zap,
  TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../../src/features/profile/context/ProfileContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/src/theme/colors';
import { useNotifications } from '@/src/features/notifications/hooks/useNotifications';
import { CommissionTierCard } from '@/src/features/subscription/components/CommissionTierCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Stats Card Component
const StatsCard = ({ icon, title, value, subtitle, color }: any) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
      {icon}
    </View>
    <View style={styles.statsContent}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// Quick Action Button Component
const QuickActionButton = ({ icon, title, subtitle, onPress, color = colors.primary }: any) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
      {icon}
    </View>
    <Text style={styles.quickActionTitle}>{title}</Text>
    {subtitle && <Text style={styles.quickActionSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { profile, stats, loading, refreshing, refreshProfile } = useProfile();
  const { signOut } = useAuth();
  const { stats: notificationStats } = useNotifications();
  
  const isSeller = profile?.role === 'seller';
  const emailLower = profile?.email?.toLowerCase();
  const isAdmin = Boolean(profile?.role === 'admin' || (emailLower && emailLower.includes('admin')));
  
  // Tab bar height + marginBottom + safe area bottom + extra padding
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;
  const tabBarMarginBottom = Platform.OS === 'ios' ? 25 : 16;
  const bottomPadding = tabBarHeight + tabBarMarginBottom + insets.bottom + 10;

  // Get theme colors based on role
  const getThemeColors = () => {
    if (isAdmin) {
      return {
        primary: '#FF3B30',
        secondary: '#FF6B6B',
        gradient: ['#FF3B30', '#FF6B6B'],
        accent: '#FFE5E5',
      };
    } else if (isSeller) {
      return {
        primary: '#FF9500',
        secondary: '#FFB84D',
        gradient: ['#FF9500', '#FFB84D'],
        accent: '#FFF4E6',
      };
    } else {
      // User - Sử dụng màu hồng cùng tone với match app
      return {
        primary: '#FF6B6B',
        secondary: '#FF8E8E',
        gradient: ['#FF6B6B', '#FF8E8E'],
        accent: '#FFE5E5',
      };
    }
  };

  const themeColors = getThemeColors();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshProfile} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Role-based Header */}
        <LinearGradient
          colors={themeColors.gradient}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>Adopet</Text>
              {isAdmin && <Text style={styles.adminBadge}>ADMIN</Text>}
              {isSeller && <Text style={styles.sellerBadge}>SELLER</Text>}
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/(tabs)/me/settings')}>
              <Settings size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Profile Card with proper spacing */}
        <View style={[styles.profileCard, { borderTopColor: themeColors.primary }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: profile?.avatar_url || 'https://via.placeholder.com/120',
                }}
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={[styles.editAvatarButton, { backgroundColor: themeColors.primary }]}
                onPress={() => router.push('/(tabs)/me/edit-profile')}
              >
                <Edit size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.full_name || 'Unknown User'}
              </Text>
              <Text style={styles.profileEmail}>{profile?.email || 'No email'}</Text>
              
              <View style={styles.roleContainer}>
                <View style={[styles.roleTag, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.roleText}>
                    {isAdmin ? 'Admin' : isSeller ? 'Seller' : 'User'}
                  </Text>
                </View>
                {profile?.created_at && (
                  <View style={[styles.roleTag, { backgroundColor: '#34C759' }]}>
                    <Calendar size={12} color="#fff" />
                    <Text style={styles.roleText}>
                      {new Date(profile.created_at).getFullYear()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Role-specific Stats Grid - Only for Admin */}
        {isAdmin && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Thống kê</Text>
            <View style={styles.statsGrid}>
              <StatsCard
                icon={<Shield size={20} color="#FF3B30" />}
                title="Reports"
                value={stats?.reports || 0}
                color="#FF3B30"
              />
              <StatsCard
                icon={<User size={20} color="#007AFF" />}
                title="Users"
                value={stats?.users || 0}
                color="#007AFF"
              />
              <StatsCard
                icon={<MessageCircle size={20} color="#FF9500" />}
                title="Posts"
                value={stats?.posts || 0}
                color="#FF9500"
              />
              <StatsCard
                icon={<TrendingUp size={20} color="#34C759" />}
                title="Activity"
                value={stats?.activity || 0}
                subtitle="Hôm nay"
                color="#34C759"
              />
            </View>
          </View>
        )}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {/* Common Actions */}
            <QuickActionButton
              icon={<User size={20} color={themeColors.primary} />}
              title="Chỉnh sửa"
              subtitle="Cập nhật thông tin"
              onPress={() => router.push('/(tabs)/me/edit-profile')}
              color={themeColors.primary}
            />
            <QuickActionButton
              icon={<Heart size={20} color="#FF5A75" />}
              title="Pets của tôi"
              subtitle="Quản lý thú cưng"
              onPress={() => router.push('/(tabs)/pets/my-pets' as any)}
              color="#FF5A75"
            />
            
            {/* Role-specific Actions */}
            {isAdmin && (
              <>
                <QuickActionButton
                  icon={<Shield size={20} color="#FF3B30" />}
                  title="Moderation"
                  subtitle="Kiểm duyệt nội dung"
                  onPress={() => router.push('/admin/reels' as any)}
                  color="#FF3B30"
                />
                <QuickActionButton
                  icon={<TrendingUp size={20} color="#34C759" />}
                  title="Analytics"
                  subtitle="Thống kê hệ thống"
                  onPress={() => router.push('/admin/analytics' as any)}
                  color="#34C759"
                />
              </>
            )}
            
            {isSeller && (
              <>
                <QuickActionButton
                  icon={<Zap size={20} color="#FF9500" />}
                  title="Tạo sản phẩm"
                  subtitle="Thêm sản phẩm mới"
                  onPress={() => router.push('/products/create' as any)}
                  color="#FF9500"
                />
                <QuickActionButton
                  icon={<TrendingUp size={20} color="#34C759" />}
                  title="Dashboard"
                  subtitle="Xem thống kê"
                  onPress={() => router.push('/(tabs)/me/dashboard' as any)}
                  color="#34C759"
                />
              </>
            )}
          </View>
        </View>

        {/* Role-specific Sections */}
        {isAdmin && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <View style={styles.menuList}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin/reels' as any)}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#FFE5E5' }]}>
                  <Shield size={16} color="#FF3B30" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Duyệt reels</Text>
                  <Text style={styles.menuSubtitle}>Quản lý nội dung</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin/payouts' as any)}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#E6F3FF' }]}>
                  <Text style={styles.menuIconText}>💰</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Quản lý payout</Text>
                  <Text style={styles.menuSubtitle}>Xử lý thanh toán</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin/disputes' as any)}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                  <Text style={styles.menuIconText}>⚖️</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Quản lý dispute</Text>
                  <Text style={styles.menuSubtitle}>Giải quyết tranh chấp</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isSeller && (
          <>
            {/* Commission Tier Card */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Hạng uy tín</Text>
              <CommissionTierCard
                reputationPoints={profile?.reputation_points || 0}
                showNextTier={true}
              />
            </View>

            {/* Seller Tools */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Công cụ bán hàng</Text>
              <View style={styles.menuList}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push('/products/manage' as any)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                    <Text style={styles.menuIconText}>📦</Text>
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Quản lý sản phẩm</Text>
                    <Text style={styles.menuSubtitle}>Xem, sửa, xóa sản phẩm</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push('/orders/manage' as any)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: '#E6F3FF' }]}>
                    <Text style={styles.menuIconText}>📋</Text>
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Quản lý đơn hàng</Text>
                    <Text style={styles.menuSubtitle}>Xử lý đơn hàng của bạn</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push('/(tabs)/me/bank-accounts' as any)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: '#E8F5E8' }]}>
                    <Text style={styles.menuIconText}>🏦</Text>
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Tài khoản ngân hàng</Text>
                    <Text style={styles.menuSubtitle}>Nhận thanh toán</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Settings Section - Separated with clear spacing */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Cài đặt & Hỗ trợ</Text>
          <View style={styles.menuList}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/me/notifications' as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#E6F3FF' }]}>
                <Bell size={16} color="#007AFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Thông báo</Text>
                <Text style={styles.menuSubtitle}>Quản lý thông báo</Text>
              </View>
              {notificationStats.unread > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationStats.unread > 9 ? '9+' : notificationStats.unread}
                  </Text>
                </View>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            {!isSeller && !isAdmin && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/me/rewards' as any)}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                  <Star size={16} color="#FF9500" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Điểm thưởng</Text>
                  <Text style={styles.menuSubtitle}>Tích điểm và đổi quà</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/me/settings')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#F8F9FA' }]}>
                <Settings size={16} color="#8E8E93" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Cài đặt</Text>
                <Text style={styles.menuSubtitle}>Ngôn ngữ, tiền tệ, v.v.</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5E8' }]}>
                <Text style={styles.menuIconText}>❓</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Trợ giúp & Hỗ trợ</Text>
                <Text style={styles.menuSubtitle}>FAQ, liên hệ hỗ trợ</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: themeColors.primary + '30' }]}
          onPress={signOut}
        >
          <Text style={[styles.signOutText, { color: themeColors.primary }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  adminBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  sellerBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Card Styles - Fixed spacing
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16, // Changed from -10 to 16 to prevent overlap
    borderRadius: 24,
    padding: 24,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  roleIcon: {
    fontSize: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  // Enhanced Subscription Card Styles
  subscriptionCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  subscriptionGradient: {
    padding: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subscriptionTitleContainer: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  subscriptionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  subscriptionStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  subscriptionContent: {
    marginBottom: 16,
  },
  subscriptionFeatures: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subscriptionExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subscriptionExpiryText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  subscriptionFooter: {
    alignItems: 'flex-end',
  },
  subscriptionCTA: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },

  // Stats Section - Fixed spacing
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  // Quick Actions Styles
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 32, // Tăng từ 24 lên 32
    marginBottom: 16, // Thêm marginBottom
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },

  // Section Styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 32, // Tăng từ 24 lên 32
    marginBottom: 8, // Thêm marginBottom
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16, // Tăng từ 12 lên 16
  },

  // Settings Section - Special spacing
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 40, // Tăng spacing đặc biệt cho settings
    marginBottom: 16,
  },

  // Menu List Styles
  menuList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8, // Thêm marginBottom
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    minHeight: 64, // Đảm bảo height tối thiểu
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 16,
  },
  menuContent: {
    flex: 1,
    paddingRight: 8, // Thêm padding để tránh ghi đè với arrow
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 18,
    color: '#C7C7CC',
    fontWeight: '300',
    minWidth: 20, // Đảm bảo width tối thiểu cho arrow
  },
  notificationBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Sign Out Button - Fixed positioning
  signOutButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
