import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, X, Eye, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationService } from '@/src/features/admin/services/verification.service';
import { formatPetLocation } from '@/src/features/pets/utils/location';

interface PendingPet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age_months?: number;
  price?: number;
  location?: string;
  description?: string;
  images: string[];
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

export default function PetsVerificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pendingPets, setPendingPets] = useState<PendingPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [selectedPet, setSelectedPet] = useState<PendingPet | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, []);

  const checkAdminAccess = async () => {
    if (!user?.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập');
      router.back();
      return;
    }

    const isAdmin = await VerificationService.isAdmin(user.id);
    if (!isAdmin) {
      Alert.alert('Lỗi', 'Bạn không có quyền truy cập trang này');
      router.back();
      return;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [petsData, statsData] = await Promise.all([
        VerificationService.getPendingPets(),
        VerificationService.getVerificationStats()
      ]);

      setPendingPets(petsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (pet: PendingPet, action: 'approve' | 'reject') => {
    setSelectedPet(pet);
    setActionType(action);
    setNotes('');
    setShowNotesModal(true);
  };

  const confirmAction = async () => {
    if (!selectedPet || !user?.id) return;

    try {
      setProcessing(selectedPet.id);
      
      let result;
      if (actionType === 'approve') {
        result = await VerificationService.approvePet(selectedPet.id, user.id, notes);
      } else {
        result = await VerificationService.rejectPet(selectedPet.id, user.id, notes);
      }

      if (result.success) {
        Alert.alert('Thành công', result.message);
        // Remove pet from pending list
        setPendingPets(prev => prev.filter(p => p.id !== selectedPet.id));
        // Update stats
        setStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          [actionType === 'approve' ? 'approved' : 'rejected']: prev[actionType === 'approve' ? 'approved' : 'rejected'] + 1
        }));
      } else {
        Alert.alert('Lỗi', result.message);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    } finally {
      setProcessing(null);
      setShowNotesModal(false);
      setSelectedPet(null);
    }
  };

  const renderPetCard = (pet: PendingPet) => (
    <View key={pet.id} style={styles.petCard}>
      {/* Pet Image */}
      <Image
        source={{ uri: pet.images[0] || 'https://via.placeholder.com/120' }}
        style={styles.petImage}
      />

      {/* Pet Info */}
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petDetails}>
          {pet.type} • {pet.breed} • {Math.floor((pet.age_months || 0) / 12)} tuổi
        </Text>
        {pet.price !== undefined && (
          <Text style={styles.petPrice}>
            {pet.price > 0 ? `${pet.price.toLocaleString('vi-VN')} VND` : 'Miễn phí'}
          </Text>
        )}
        {pet.location && (
          <Text style={styles.petLocation}>{formatPetLocation(pet.location)}</Text>
        )}
        
        {/* Seller Info */}
        <View style={styles.sellerInfo}>
          <Image
            source={{ uri: pet.profiles.avatar_url || 'https://via.placeholder.com/30' }}
            style={styles.sellerAvatar}
          />
          <View>
            <Text style={styles.sellerName}>{pet.profiles.full_name}</Text>
            <Text style={styles.sellerEmail}>{pet.profiles.email}</Text>
          </View>
        </View>

        <Text style={styles.createdAt}>
          Tạo: {new Date(pet.created_at).toLocaleDateString('vi-VN')}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push(`/pet/${pet.id}`)}
        >
          <Eye size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleAction(pet, 'reject')}
          disabled={processing === pet.id}
        >
          {processing === pet.id && actionType === 'reject' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <X size={20} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleAction(pet, 'approve')}
          disabled={processing === pet.id}
        >
          {processing === pet.id && actionType === 'approve' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Check size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duyệt Pets</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Chờ duyệt</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Đã duyệt</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Từ chối</Text>
        </View>
      </View>

      {/* Pet List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {pendingPets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có pet nào cần duyệt</Text>
          </View>
        ) : (
          pendingPets.map(renderPetCard)
        )}
      </ScrollView>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <Text style={styles.modalCancel}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? 'Duyệt Pet' : 'Từ chối Pet'}
            </Text>
            <TouchableOpacity onPress={confirmAction}>
              <Text style={styles.modalConfirm}>Xác nhận</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Ghi chú (tùy chọn):</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Nhập ghi chú..."
              multiline
              numberOfLines={4}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  petCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  petInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  petPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginTop: 2,
  },
  petLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  sellerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sellerEmail: {
    fontSize: 10,
    color: '#999',
  },
  createdAt: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4CD964',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  modalContent: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
});