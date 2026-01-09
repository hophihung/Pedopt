import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Trash2, Archive } from 'lucide-react-native';
import { NotificationBadge } from '@/src/components/NotificationBadge';
import { Conversation } from '../services/chat.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80; // Minimum swipe distance to trigger action
const ACTION_WIDTH = 80; // Width of action buttons

interface SwipeableConversationItemProps {
  conversation: Conversation;
  otherUser: any;
  unreadCount: number;
  hasUnread: boolean;
  onPress: () => void;
  onDelete: () => void;
  onArchive?: () => void;
}

export function SwipeableConversationItem({
  conversation,
  otherUser,
  unreadCount,
  hasUnread,
  onPress,
  onDelete,
  onArchive,
}: SwipeableConversationItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        setIsSwipeActive(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        
        if (dx < -SWIPE_THRESHOLD) {
          // Swipe left - Delete
          Animated.timing(translateX, {
            toValue: -ACTION_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
            resetSwipe();
          });
        } else {
          // Snap back to center
          resetSwipe();
        }
      },
    })
  ).current;

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsSwipeActive(false);
    });
  };

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={styles.actionsContainer}>
        {/* Delete Action (Left swipe) */}
        <View style={[styles.actionButton, styles.deleteAction]}>
          <Trash2 size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Xóa</Text>
        </View>
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.conversationItem,
          hasUnread && styles.conversationItemUnread,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: String(otherUser?.avatar_url || 'https://via.placeholder.com/50') }}
              style={styles.avatar}
            />
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
          
          <View style={styles.textContent}>
            <View style={styles.conversationHeader}>
              <Text style={[
                styles.userName,
                hasUnread && styles.userNameUnread
              ]}>
                {otherUser?.full_name ? String(otherUser.full_name) : 'Unknown User'}
              </Text>
              
              {hasUnread && (
                <NotificationBadge 
                  count={unreadCount} 
                  size="small"
                />
              )}
            </View>
            
            <Text style={[
              styles.statusText,
              hasUnread && styles.statusTextUnread
            ]} numberOfLines={1}>
              {hasUnread 
                ? `${unreadCount} tin nhắn mới` 
                : 'Có hoạt động gần đây, tương hợp ngay!'
              }
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    marginLeft: 'auto',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  conversationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationItemUnread: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    shadowOpacity: 0.1,
  },
  conversationContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F2F5',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  userNameUnread: {
    fontWeight: '700',
    color: '#1F2937',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statusTextUnread: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
});