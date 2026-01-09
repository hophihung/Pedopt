import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, MessageCircle } from 'lucide-react-native';
import { SuperLike } from '../services/super-like.service';

interface PinnedSuperLikeMessageProps {
  superLike: SuperLike;
  onReply: (superLikeId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const PinnedSuperLikeMessage: React.FC<PinnedSuperLikeMessageProps> = ({
  superLike,
  onReply,
  onViewProfile,
}) => {
  const getFirstImage = (images: string[] | string | undefined) => {
    if (!images) return null;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed[0] : null;
      } catch {
        return null;
      }
    }
    return Array.isArray(images) ? images[0] : null;
  };

  const firstImage = getFirstImage(superLike.pet_images);

  return (
    <View style={styles.container}>
      {/* Pinned indicator */}
      <View style={styles.pinnedIndicator}>
        <Star size={16} color="#FFD700" fill="#FFD700" />
        <Text style={styles.pinnedText}>Tin nhắn được ghim</Text>
      </View>

      <View style={styles.content}>
        {/* User avatar */}
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => onViewProfile(superLike.user_id)}
        >
          {superLike.user_avatar ? (
            <Image source={{ uri: superLike.user_avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {superLike.user_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Message content */}
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.userName}>{superLike.user_name || 'Người dùng'}</Text>
            <Text style={styles.timeAgo}>
              {new Date(superLike.created_at).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          <View style={styles.superLikeMessage}>
            <Star size={18} color="#FFD700" fill="#FFD700" />
            <Text style={styles.messageText}>
              đã Super Like {superLike.pet_name}
            </Text>
          </View>

          {/* Pet preview */}
          {firstImage && (
            <View style={styles.petPreview}>
              <Image source={{ uri: firstImage }} style={styles.petImage} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{superLike.pet_name}</Text>
                <Text style={styles.petType}>{superLike.pet_type}</Text>
              </View>
            </View>
          )}

          {/* Reply button */}
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => onReply(superLike.id)}
          >
            <MessageCircle size={16} color="#FFFFFF" />
            <Text style={styles.replyButtonText}>Trả lời</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  timeAgo: {
    fontSize: 12,
    color: '#6B7280',
  },
  superLikeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  petPreview: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 8,
  },
  petImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  petInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  petType: {
    fontSize: 12,
    color: '#6B7280',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  replyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});