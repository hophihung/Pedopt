import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Save, User, Mail, Phone, MapPin, Calendar, Home, Building } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/src/features/profile/context/ProfileContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

interface ProfileFormData {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  date_of_birth?: string;
  avatar_url?: string;
  // Shipping address fields
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_ward?: string;
  shipping_district?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  is_default_shipping?: boolean;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    date_of_birth: '',
    avatar_url: '',
    // Shipping address
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_ward: '',
    shipping_district: '',
    shipping_city: '',
    shipping_postal_code: '',
    is_default_shipping: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        date_of_birth: profile.date_of_birth || '',
        avatar_url: profile.avatar_url || '',
        // Shipping address
        shipping_name: profile.shipping_name || '',
        shipping_phone: profile.shipping_phone || '',
        shipping_address: profile.shipping_address || '',
        shipping_ward: profile.shipping_ward || '',
        shipping_district: profile.shipping_district || '',
        shipping_city: profile.shipping_city || '',
        shipping_postal_code: profile.shipping_postal_code || '',
        is_default_shipping: profile.is_default_shipping || false,
      });
    }
  }, [profile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Sử dụng FileSystem để đọc file trong React Native
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // Convert base64 to binary
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(filePath, byteArray, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    try {
      setLoading(true);

      // Chỉ update những trường đã tồn tại trong database
      const updateData: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        location: formData.location?.trim() || null,
        bio: formData.bio?.trim() || null,
        date_of_birth: formData.date_of_birth?.trim() || null,
        // Shipping address fields
        shipping_name: formData.shipping_name?.trim() || null,
        shipping_phone: formData.shipping_phone?.trim() || null,
        shipping_address: formData.shipping_address?.trim() || null,
        shipping_ward: formData.shipping_ward?.trim() || null,
        shipping_district: formData.shipping_district?.trim() || null,
        shipping_city: formData.shipping_city?.trim() || null,
        shipping_postal_code: formData.shipping_postal_code?.trim() || null,
        is_default_shipping: formData.is_default_shipping || false,
        updated_at: new Date().toISOString(),
      };

      // Chỉ thêm avatar_url nếu có
      if (formData.avatar_url) {
        updateData.avatar_url = formData.avatar_url;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      await refreshProfile();
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Save size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            <Image
              source={{
                uri: formData.avatar_url || 'https://via.placeholder.com/120',
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraButton}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Nhấn để thay đổi ảnh đại diện</Text>
        </View>

        {/* Form Fields - Chỉ những trường đã tồn tại trong DB */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Họ và tên *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.full_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email *</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Nhập email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Shipping Address Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          <Text style={styles.sectionSubtitle}>Thông tin này sẽ được sử dụng làm địa chỉ mặc định khi đặt hàng</Text>
          
          {/* Shipping Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Tên người nhận</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.shipping_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, shipping_name: text }))}
                placeholder="Tên người nhận hàng"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Shipping Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Số điện thoại nhận hàng</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.shipping_phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, shipping_phone: text }))}
                placeholder="Số điện thoại nhận hàng"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Shipping Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Địa chỉ chi tiết</Text>
            <View style={styles.inputContainer}>
              <Home size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.shipping_address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, shipping_address: text }))}
                placeholder="Số nhà, tên đường"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Ward and District */}
          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Phường/Xã</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.shipping_ward}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, shipping_ward: text }))}
                  placeholder="Phường/Xã"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={[styles.fieldContainer, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Quận/Huyện</Text>
              <View style={styles.inputContainer}>
                <Building size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.shipping_district}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, shipping_district: text }))}
                  placeholder="Quận/Huyện"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* City and Postal Code */}
          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Tỉnh/Thành phố</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.shipping_city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, shipping_city: text }))}
                  placeholder="Tỉnh/Thành phố"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={[styles.fieldContainer, styles.halfWidth]}>
              <Text style={styles.fieldLabel}>Mã bưu điện</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.shipping_postal_code}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, shipping_postal_code: text }))}
                  placeholder="Mã bưu điện"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Other Info Section */}
        <View style={styles.formContainer}>

          {/* Role Display (Read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Vai trò</Text>
            <View style={[styles.inputContainer, styles.readOnlyContainer]}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>
                {profile?.role === 'seller' ? ' Seller' : 
                 profile?.role === 'admin' ? ' Admin' : ' User'}
              </Text>
            </View>
          </View>

          {/* Created At Display (Read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Thành viên từ</Text>
            <View style={[styles.inputContainer, styles.readOnlyContainer]}>
              <Calendar size={20} color="#666" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('vi-VN')
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButtonLarge, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Thêm padding để tránh bị tab layout che
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 40, // Tăng margin bottom để tránh bị tab che
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  readOnlyContainer: {
    backgroundColor: '#F5F5F5',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    padding: 0,
  },
});