import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Database, Trash2, RefreshCw, Clock } from 'lucide-react-native';
import { usePetCache } from '@/src/contexts/PetCacheContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/src/theme/colors';

export function CacheDebugPanel() {
  const { user } = useAuth();
  const { 
    getCacheAge, 
    isCacheValid, 
    clearCache, 
    clearAllCache,
    invalidateUserPets 
  } = usePetCache();
  
  const [cacheInfo, setCacheInfo] = useState<{
    userPetsAge: number | null;
    userPetsValid: boolean;
  }>({
    userPetsAge: null,
    userPetsValid: false,
  });

  const loadCacheInfo = async () => {
    if (!user) return;

    try {
      const userPetsKey = `user_pets_${user.id}`;
      const age = await getCacheAge(userPetsKey);
      const valid = await isCacheValid(userPetsKey);
      
      setCacheInfo({
        userPetsAge: age,
        userPetsValid: valid,
      });
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
  };

  useEffect(() => {
    loadCacheInfo();
    
    // Refresh cache info every 30 seconds
    const interval = setInterval(loadCacheInfo, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleClearUserPetsCache = async () => {
    if (!user) return;
    
    try {
      await invalidateUserPets(user.id);
      await loadCacheInfo();
      Alert.alert('Thành công', 'Đã xóa cache pets của bạn');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa cache');
    }
  };

  const handleClearAllCache = async () => {
    try {
      await clearAllCache();
      await loadCacheInfo();
      Alert.alert('Thành công', 'Đã xóa tất cả cache');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa cache');
    }
  };

  const formatCacheAge = (ageMinutes: number | null) => {
    if (ageMinutes === null) return 'Không có cache';
    if (ageMinutes < 1) return 'Vừa tạo';
    if (ageMinutes < 60) return `${ageMinutes} phút trước`;
    const hours = Math.floor(ageMinutes / 60);
    const minutes = ageMinutes % 60;
    return `${hours}h ${minutes}m trước`;
  };

  const getCacheStatusColor = (valid: boolean, age: number | null) => {
    if (!valid || age === null) return '#F44336'; // Red - no cache
    if (age < 5) return '#4CAF50'; // Green - fresh
    if (age < 15) return '#FF9800'; // Orange - getting old
    return '#F44336'; // Red - expired
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Database size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Cache Debug Panel</Text>
      </View>

      {/* User Pets Cache */}
      <View style={styles.cacheSection}>
        <View style={styles.cacheSectionHeader}>
          <Text style={styles.cacheSectionTitle}>My Pets Cache</Text>
          <View style={[
            styles.cacheStatusDot,
            { backgroundColor: getCacheStatusColor(cacheInfo.userPetsValid, cacheInfo.userPetsAge) }
          ]} />
        </View>
        
        <View style={styles.cacheDetails}>
          <View style={styles.cacheDetailRow}>
            <Clock size={16} color="#666" />
            <Text style={styles.cacheDetailLabel}>Tuổi cache:</Text>
            <Text style={styles.cacheDetailValue}>
              {formatCacheAge(cacheInfo.userPetsAge)}
            </Text>
          </View>
          
          <View style={styles.cacheDetailRow}>
            <Database size={16} color="#666" />
            <Text style={styles.cacheDetailLabel}>Trạng thái:</Text>
            <Text style={[
              styles.cacheDetailValue,
              { color: getCacheStatusColor(cacheInfo.userPetsValid, cacheInfo.userPetsAge) }
            ]}>
              {cacheInfo.userPetsValid ? 'Còn hiệu lực' : 'Hết hạn/Không có'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cacheActionButton}
          onPress={handleClearUserPetsCache}
        >
          <Trash2 size={16} color="#fff" />
          <Text style={styles.cacheActionButtonText}>Xóa Cache Pets</Text>
        </TouchableOpacity>
      </View>

      {/* Cache Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.actionsSectionTitle}>Cache Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton]}
          onPress={loadCacheInfo}
        >
          <RefreshCw size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Refresh Cache Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearAllButton]}
          onPress={handleClearAllCache}
        >
          <Trash2 size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Clear All Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Cache Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Cache Information</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚀 Cách hoạt động:</Text>
          <Text style={styles.infoText}>
            • Lần đầu load: Lấy từ cache (nếu có) → Hiển thị ngay{'\n'}
            • Background: Fetch từ server → Update cache{'\n'}
            • Cache fresh (&lt; 5 phút): Không fetch server{'\n'}
            • Cache cũ (&gt; 5 phút): Fetch server trong background
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⏰ Cache TTL:</Text>
          <Text style={styles.infoText}>
            • User Pets: 15 phút{'\n'}
            • General Cache: 10 phút{'\n'}
            • Auto refresh khi cache &gt; 5 phút
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💾 Storage:</Text>
          <Text style={styles.infoText}>
            • Memory Cache: Truy cập nhanh{'\n'}
            • AsyncStorage: Persistent cache{'\n'}
            • Auto cleanup khi hết hạn
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  cacheSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cacheSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cacheSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cacheStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cacheDetails: {
    gap: 8,
    marginBottom: 16,
  },
  cacheDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cacheDetailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cacheDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cacheActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cacheActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  clearAllButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});