import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Heart, X, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchNotificationProps {
  visible: boolean;
  matchedUser: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  pet: {
    id: string;
    name: string;
    images: string[];
  };
  onClose: () => void;
  onMessage: () => void;
}

export function MatchNotification({
  visible,
  matchedUser,
  pet,
  onClose,
  onMessage,
}: MatchNotificationProps) {
  const router = useRouter();
  const [slideAnim] = useState(new Animated.Value(-SCREEN_WIDTH));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Slide in from left
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Slide out to right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleMessage = () => {
    handleClose();
    onMessage();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Match Icon */}
          <View style={styles.matchIcon}>
            <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
          </View>

          {/* Title */}
          <Text style={styles.title}>It's a Match! 🎉</Text>
          <Text style={styles.subtitle}>
            Bạn và {matchedUser.full_name} đều thích nhau!
          </Text>

          {/* Avatars */}
          <View style={styles.avatarsContainer}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: matchedUser.avatar_url }}
                style={styles.avatar}
              />
            </View>
            
            <View style={styles.heartContainer}>
              <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: pet.images[0] }}
                style={styles.avatar}
              />
            </View>
          </View>

          {/* Pet Info */}
          <Text style={styles.petInfo}>
            Về thú cưng: {pet.name}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
            >
              <MessageCircle size={18} color="#FF6B6B" />
              <Text style={styles.messageButtonText}>Nhắn tin ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  gradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
  },
  matchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  avatarWrapper: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 32,
    padding: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F2F5',
  },
  heartContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  actions: {
    width: '100%',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
});