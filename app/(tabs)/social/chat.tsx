import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import { ChatScreen } from '@/src/components';
import { Conversation, ChatService } from '@/src/features/chat';
import { NewMatchesSection } from '@/src/features/chat/components/NewMatchesSection';
import { SwipeableConversationItem } from '@/src/features/chat/components/SwipeableConversationItem';
import { useUnreadCount } from '@/src/features/chat/hooks/useUnreadCount';
import { useHiddenConversations } from '@/src/features/chat/hooks/useHiddenConversations';
import { NotificationBadge } from '@/src/components/NotificationBadge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme/colors';
// Temporarily using icon fallback to fix view registry error
import { MessageCircle, Eye, EyeOff } from '@/src/utils/iconFallback';

export default function ChatTabScreen() {
  /* ===================== HOOKS ===================== */
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { conversationUnreadCounts, markConversationAsRead, loadConversationUnreadCount } = useUnreadCount();
  const { filterVisibleConversations, hideConversation, hiddenCount } = useHiddenConversations();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<'community' | 'chat'>('chat');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  /* ===================== EFFECTS ===================== */
  useEffect(() => {
    setActiveTab(pathname?.includes('/community') ? 'community' : 'chat');
  }, [pathname]);

  useEffect(() => {
    if (!user?.id) return;

    const loadSavedData = async () => {
      try {
        const savedConversation = await AsyncStorage.getItem(`selected_conversation_${user.id}`);
        const savedScrollPos = await AsyncStorage.getItem(`scroll_position_${user.id}`);

        if (savedConversation) {
          setSelectedConversation(JSON.parse(savedConversation));
        }

        if (savedScrollPos) {
          setScrollPosition(Number(savedScrollPos));
        }
      } catch (e) {
        console.log('Load saved data error:', e);
      }
    };

    loadSavedData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await ChatService.getConversations(user.id);
        setConversations(data);
        
        // Load unread counts for each conversation
        data.forEach(conv => {
          loadConversationUnreadCount(conv.id);
        });
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user?.id, loadConversationUnreadCount]);

  useEffect(() => {
    return () => {
      if (user?.id) {
        AsyncStorage.removeItem(`selected_conversation_${user.id}`);
      }
    };
  }, [user?.id]);

  /* ===================== HANDLERS ===================== */
  const handleTabChange = (tab: 'community' | 'chat') => {
    setActiveTab(tab);
    router.replace(tab === 'community' ? '/(tabs)/social/community' : '/(tabs)/social/chat');
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    try {
      if (flatListRef.current) {
        // Lưu scroll position hiện tại
        const currentOffset = scrollPosition;
        setScrollPosition(currentOffset);
        await AsyncStorage.setItem(`scroll_position_${user?.id}`, currentOffset.toString());
      }

      await AsyncStorage.setItem(`selected_conversation_${user?.id}`, JSON.stringify(conversation));
      
      // Mark conversation as read
      await markConversationAsRead(conversation.id);
    } catch (e) {
      console.log('Save conversation error:', e);
    } finally {
      setSelectedConversation(conversation);
    }
  };

  // Handle match press from NewMatchesSection
  const handleMatchPress = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      handleConversationSelect(conversation);
    }
  };

  const handleBack = async () => {
    setSelectedConversation(null);

    try {
      await AsyncStorage.removeItem(`selected_conversation_${user?.id}`);
    } catch (e) {
      console.log('Clear conversation error:', e);
    }

    // Restore scroll position
    setTimeout(() => {
      if (scrollPosition > 0 && flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: scrollPosition, animated: false });
      }
    }, 100);
  };

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    setScrollPosition(currentOffset);
  };

  // Handle conversation deletion (client-side only)
  const handleDeleteConversation = (conversation: Conversation) => {
    const otherUser = user?.id === conversation.buyer_id ? conversation.seller : conversation.buyer;
    const userName = otherUser?.full_name || 'Unknown User';
    
    Alert.alert(
      'Xóa cuộc trò chuyện',
      `Bạn có chắc muốn xóa cuộc trò chuyện với ${userName}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            hideConversation(conversation.id);
          },
        },
      ]
    );
  };

  // Get filtered conversations based on show hidden state
  const getFilteredConversations = () => {
    if (showHidden) {
      return conversations; // Show all conversations
    } else {
      return filterVisibleConversations(conversations); // Filter out hidden ones
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = user?.id === item.buyer_id ? item.seller : item.buyer;
    const unreadCount = conversationUnreadCounts[item.id] || 0;
    const hasUnread = unreadCount > 0;

    return (
      <SwipeableConversationItem
        conversation={item}
        otherUser={otherUser}
        unreadCount={unreadCount}
        hasUnread={hasUnread}
        onPress={() => handleConversationSelect(item)}
        onDelete={() => handleDeleteConversation(item)}
        // onArchive={() => {}} // Optional archive functionality
      />
    );
  };

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      {selectedConversation ? (
        <ChatScreen conversation={selectedConversation} onBack={handleBack} />
      ) : (
        <>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.logoIcon}>🐾</Text>

            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'community' && styles.tabButtonActive]}
                onPress={() => handleTabChange('community')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'community' && styles.tabButtonTextActive]}>
                  Cộng đồng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'chat' && styles.tabButtonActive]}
                onPress={() => handleTabChange('chat')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'chat' && styles.tabButtonTextActive]}>
                  Tin nhắn
                </Text>
              </TouchableOpacity>
            </View>

            {/* Show/Hide Hidden Conversations Toggle */}
            {hiddenCount > 0 && (
              <TouchableOpacity
                style={styles.hiddenToggle}
                onPress={() => setShowHidden(!showHidden)}
              >
                {showHidden ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
                {!showHidden && (
                  <NotificationBadge 
                    count={hiddenCount} 
                    size="small"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Chat List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải cuộc trò chuyện...</Text>
            </View>
          ) : getFilteredConversations().length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageCircle size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>
                {showHidden ? 'Không có cuộc trò chuyện nào bị ẩn' : 'Chưa có cuộc trò chuyện nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {showHidden 
                  ? 'Các cuộc trò chuyện bị ẩn sẽ hiển thị ở đây.'
                  : 'Thích một pet để bắt đầu trò chuyện với người bán!'
                }
              </Text>
            </View>
          ) : (
            <View style={[styles.chatContent, { paddingBottom: insets.bottom + 80 }]}>
              {/* New Matches Section - Only show when not viewing hidden */}
              {!showHidden && (
                <NewMatchesSection 
                  onMatchPress={handleMatchPress}
                  onSeeAllPress={() => {
                    // Scroll to top to show all conversations
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                  }}
                />
              )}

              {/* Hidden conversations info */}
              {showHidden && (
                <View style={styles.hiddenInfo}>
                  <Text style={styles.hiddenInfoText}>
                    Đang hiển thị {hiddenCount} cuộc trò chuyện đã ẩn
                  </Text>
                </View>
              )}

              {/* Conversations List */}
              <FlatList
                ref={flatListRef}
                data={getFilteredConversations()}
                keyExtractor={(item) => item.id}
                renderItem={renderConversation}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 20 }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 20,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 28,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabButtonTextActive: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  hiddenToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  list: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  hiddenInfo: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  hiddenInfoText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
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
    color: '#6B7280',
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
  statusTextUnread: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
});
