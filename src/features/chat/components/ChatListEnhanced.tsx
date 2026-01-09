import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatService, Conversation } from '../services/chat.service';
import { useAuth } from '../../../../contexts/AuthContext';
import { colors } from '@/src/theme/colors';

interface ChatListProps {
  onConversationSelect: (conversation: Conversation) => void;
  cachedData?: any;
  onDataChange?: (data: any) => void;
  initialScrollPosition?: number;
}

export interface ChatListRef {
  getScrollPosition: () => number;
  scrollToPosition: (position: number) => void;
  refreshData: () => void;
}

export const ChatListEnhanced = forwardRef<ChatListRef, ChatListProps>(({
  onConversationSelect,
  cachedData,
  onDataChange,
  initialScrollPosition = 0
}, ref) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [conversations, setConversations] = useState<Conversation[]>(cachedData?.conversations || []);
  const [loading, setLoading] = useState(!cachedData);
  const [hiddenBuyerIds, setHiddenBuyerIds] = useState<Set<string>>(
    cachedData?.hiddenBuyerIds ? new Set(cachedData.hiddenBuyerIds) : new Set()
  );
  const [scrollPosition, setScrollPosition] = useState(initialScrollPosition);
  
  // Tab bar height (70) + marginBottom (20) + safe area bottom
  const tabBarHeight = 70;
  const tabBarMarginBottom = 20;
  const bottomPadding = tabBarHeight + tabBarMarginBottom + insets.bottom;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getScrollPosition: () => scrollPosition,
    scrollToPosition: (position: number) => {
      flatListRef.current?.scrollToOffset({ offset: position, animated: false });
    },
    refreshData: () => {
      loadConversations();
    }
  }));

  // Notify parent component when data changes
  useEffect(() => {
    if (onDataChange && conversations.length > 0) {
      const data = {
        conversations,
        hiddenBuyerIds: Array.from(hiddenBuyerIds),
        timestamp: Date.now()
      };
      onDataChange(data);
    }
  }, [conversations.length, hiddenBuyerIds.size]); // Chỉ theo dõi length và size để tránh deep comparison

  // Save to AsyncStorage for persistence
  useEffect(() => {
    const saveToStorage = async () => {
      if (!user?.id) return;
      try {
        const cacheKey = `chat_list_cache_${user.id}`;
        const cacheData = {
          conversations,
          hiddenBuyerIds: Array.from(hiddenBuyerIds),
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        console.log('Error saving chat cache:', error);
      }
    };

    if (conversations.length > 0) {
      saveToStorage();
    }
  }, [conversations, hiddenBuyerIds, user?.id]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      if (!user?.id || cachedData) return;
      
      try {
        const cacheKey = `chat_list_cache_${user.id}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cacheData = JSON.parse(cached);
          // Only use cache if it's less than 5 minutes old
          if (Date.now() - cacheData.timestamp < 5 * 60 * 1000) {
            setConversations(cacheData.conversations || []);
            setHiddenBuyerIds(new Set(cacheData.hiddenBuyerIds || []));
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log('Error loading chat cache:', error);
      }
      
      // If no valid cache, load fresh data
      loadConversations();
    };

    loadFromStorage();
  }, [user?.id, cachedData]);

  const loadHiddenBuyers = useCallback(async () => {
    if (!user?.id) return;
    try {
      const key = `hidden_buyers_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const hiddenIds = JSON.parse(stored) as string[];
        setHiddenBuyerIds(new Set(hiddenIds));
      }
    } catch (error) {
      console.error('Error loading hidden buyers:', error);
    }
  }, [user?.id]);

  const saveHiddenBuyers = useCallback(async (hiddenIds: Set<string>) => {
    if (!user?.id) return;
    try {
      const key = `hidden_buyers_${user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(Array.from(hiddenIds)));
    } catch (error) {
      console.error('Error saving hidden buyers:', error);
    }
  }, [user?.id]);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await ChatService.getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const subscribeToUpdates = useCallback(() => {
    if (!user?.id) return;

    const subscription = ChatService.subscribeToConversationList(
      user.id,
      (conversation) => {
        setConversations(prev => {
          const existing = prev.find(c => c.id === conversation.id);
          if (existing) {
            return prev.map(c => c.id === conversation.id ? conversation : c);
          } else {
            return [conversation, ...prev];
          }
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && !cachedData) {
      loadHiddenBuyers();
      const unsubscribe = subscribeToUpdates();
      return unsubscribe;
    }
  }, [user?.id, cachedData, loadHiddenBuyers, subscribeToUpdates]);

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && conversations.length > 0 && initialScrollPosition > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ 
          offset: initialScrollPosition, 
          animated: false 
        });
      }, 100);
    }
  }, [loading, conversations.length, initialScrollPosition]);

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    setScrollPosition(currentOffset);
  };

  const renderConversation = useCallback(({ item }: { item: Conversation }) => {
    const otherUser = user?.id === item.buyer_id ? item.seller : item.buyer;

    const renderRightActions = (_: any, dragX: Animated.AnimatedInterpolation<number>) => {
      return (
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={async () => {
              if (!user?.id) return;
              try {
                await ChatService.archiveConversation(item.id, user.id);
                setConversations(prev => prev.filter(c => c.id !== item.id));
              } catch (e) {
                console.error('Error archiving conversation', e);
              }
            }}
          >
            <Text style={styles.deleteText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => onConversationSelect(item)}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ 
                uri: String(otherUser?.avatar_url || 'https://via.placeholder.com/50')
              }}
              style={styles.avatar}
            />
            {item.unread_count && item.unread_count > 0 ? (
              <View style={styles.onlineDot} />
            ) : null}
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={styles.userName}>
                {otherUser?.full_name ? String(otherUser.full_name) : 'Unknown User'}
              </Text>
              {item.unread_count && item.unread_count > 0 ? (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>User mới</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.statusText} numberOfLines={1}>
              Có hoạt động gần đây, tương hợp ngay!
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }, [user?.id, onConversationSelect]);

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải cuộc trò chuyện...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MessageCircle size={64} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
        <Text style={styles.emptySubtitle}>
          Thích một pet để bắt đầu trò chuyện với người bán!
        </Text>
      </View>
    );
  }

  const renderHeader = useCallback(() => {
    // Chỉ lấy conversations mà user là seller (người khác đã swipe pet của user)
    // Và loại bỏ những buyer đã bị ẩn
    const recentMatches = conversations
      .filter(c => {
        // Chỉ lấy conversations mà user là seller
        if (user?.id !== c.seller_id) return false;
        // Loại bỏ những buyer đã bị ẩn
        if (hiddenBuyerIds.has(c.buyer_id)) return false;
        // Phải có pet
        return c.pet;
      })
      .slice(0, 10);

    if (recentMatches.length === 0) return null;

    return (
      <View style={styles.matchesSection}>
        <Text style={styles.sectionTitle}>Người Mua mới</Text>
        <FlatList
          horizontal
          data={recentMatches}
          keyExtractor={(item) => `match-${item.id}`}
          renderItem={({ item }) => {
            const buyer = item.buyer;
            const buyerAvatar = buyer?.avatar_url 
              ? String(buyer.avatar_url)
              : 'https://via.placeholder.com/100';
            const buyerName = buyer?.full_name 
              ? String(buyer.full_name)
              : 'Unknown';

            return (
              <TouchableOpacity
                style={styles.matchItem}
                onPress={() => {
                  // Ẩn profile khi click vào
                  const newHiddenIds = new Set(hiddenBuyerIds).add(item.buyer_id);
                  setHiddenBuyerIds(newHiddenIds);
                  saveHiddenBuyers(newHiddenIds);
                  // Vẫn mở conversation
                  onConversationSelect(item);
                }}
              >
                <View style={styles.matchImageContainer}>
                  <Image
                    source={{ uri: buyerAvatar || 'https://via.placeholder.com/100' }}
                    style={styles.matchImage}
                  />
                  {item.unread_count && item.unread_count > 0 ? (
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>
                        {String(item.unread_count)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.matchName} numberOfLines={1}>
                  {buyerName}
                </Text>
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matchesContent}
        />
      </View>
    );
  }, [conversations, hiddenBuyerIds, user?.id, onConversationSelect, saveHiddenBuyers]);

  return (
    <FlatList
      ref={flatListRef}
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={renderConversation}
      ListHeaderComponent={renderHeader}
      style={styles.list}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
      maxToRenderPerBatch={8}
      windowSize={8}
      initialNumToRender={8}
      updateCellsBatchingPeriod={50}
      getItemLayout={undefined} // Để FlatList tự tính toán
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 100,
      }}
    />
  );
});

// Copy all styles from original ChatList
const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  matchesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginBottom: 12,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  matchesContent: {
    paddingHorizontal: 12,
  },
  matchItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 80,
  },
  matchImageContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  matchImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  matchBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  matchName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#050505',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#31A24C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  newBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
    height: '100%',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 20,
    marginRight: 16,
  },
  deleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});