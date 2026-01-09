import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Facebook, Link, Unlink, User } from 'lucide-react-native';
import { useFacebookConnection } from '../hooks/useFacebookConnection';
import { colors } from '@/src/theme/colors';

export function FacebookConnection() {
  const {
    loading,
    connecting,
    isConnected,
    connection,
    connect,
    disconnect,
  } = useFacebookConnection();

  const handleConnect = async () => {
    const result = await connect();
    
    if (result.success) {
      Alert.alert('Thành công', result.message);
    } else {
      Alert.alert('Lỗi', result.message);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Ngắt kết nối Facebook',
      'Bạn có chắc muốn ngắt kết nối tài khoản Facebook? Bạn có thể kết nối lại bất cứ lúc nào.',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Ngắt kết nối',
          style: 'destructive',
          onPress: performDisconnect,
        },
      ]
    );
  };

  const performDisconnect = async () => {
    const result = await disconnect();
    
    if (result.success) {
      Alert.alert('Thành công', result.message);
    } else {
      Alert.alert('Lỗi', result.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Facebook size={20} color={colors.primary} />
          <Text style={styles.title}>Kết nối Facebook</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Facebook size={20} color="#1877F2" />
        <Text style={styles.title}>Kết nối Facebook</Text>
      </View>

      <Text style={styles.description}>
        Kết nối tài khoản Facebook để dễ dàng chia sẻ và tương tác với bạn bè.
      </Text>

      {isConnected && connection ? (
        <View style={styles.connectedContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {connection.facebook_avatar ? (
                <Image
                  source={{ uri: connection.facebook_avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={24} color="#666" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{connection.facebook_name}</Text>
              {connection.facebook_email && (
                <Text style={styles.profileEmail}>{connection.facebook_email}</Text>
              )}
              <Text style={styles.connectedDate}>
                Kết nối từ {new Date(connection.connected_at).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={handleDisconnect}
            disabled={connecting}
            activeOpacity={0.8}
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Unlink size={18} color="#fff" />
                <Text style={styles.disconnectButtonText}>Ngắt kết nối</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.connectButton]}
          onPress={handleConnect}
          disabled={connecting}
          activeOpacity={0.8}
        >
          {connecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Link size={18} color="#fff" />
              <Text style={styles.connectButtonText}>Kết nối Facebook</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🔒 Thông tin Facebook của bạn được bảo mật và chỉ được sử dụng để cải thiện trải nghiệm sử dụng ứng dụng.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  connectedContainer: {
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  connectedDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#1877F2',
    marginBottom: 16,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D0E7FF',
  },
  infoText: {
    fontSize: 13,
    color: '#0066CC',
    lineHeight: 18,
  },
});