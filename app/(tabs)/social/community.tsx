import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Plus,
  X,
  Send,
  Users,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { PostCommentService } from '@/src/features/posts/services/PostComment.Service';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme/colors';
import { SkeletonList } from '@/src/components/Skeleton';
import { Header } from '@/src/components/Header';
import { MoreOptionsMenu } from '@/src/components/MoreOptionsMenu';

/* ============================================================
   🧩 1. Kiểu dữ liệu
   ============================================================ */
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles: Profile | Profile[] | null;
}

interface LikePayload {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

interface CommentPayload {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile | Profile[] | null;
}

/* ============================================================
   💬 2. Component chính
   ============================================================ */

const CommunityScreen: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'community' | 'chat'>('community');
  
  // Tab bar height + marginBottom + safe area bottom + extra padding
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;
  const tabBarMarginBottom = Platform.OS === 'ios' ? 25 : 16;
  const bottomPadding = tabBarHeight + tabBarMarginBottom + insets.bottom + 10;
  
  // Navigate between community and chat
  const handleTabChange = (tab: 'community' | 'chat') => {
    setActiveTab(tab);
    if (tab === 'chat') {
      router.replace('/(tabs)/social/chat');
    } else {
      router.replace('/(tabs)/social/community');
    }
  };

  // Update active tab based on current pathname
  useEffect(() => {
    if (pathname?.includes('/chat')) {
      setActiveTab('chat');
    } else {
      setActiveTab('community');
    }
  }, [pathname]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [likePostMap, setLikePostMap] = useState<Map<string, string>>(
    new Map()
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Comment modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // 🔄 Lấy posts
  const fetchPosts = async (mode: 'initial' | 'refresh' = 'initial'): Promise<void> => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          id,
          user_id,
          content,
          image_url,
          like_count,
          comment_count,
          created_at,
          profiles!posts_user_id_fkey ( id, full_name, avatar_url )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data as Post[]) || []);
    } catch (err) {
      console.error('❌ Lỗi tải bài viết:', err);
    } finally {
      if (mode === 'initial') {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  // 🔄 Update like count cho post
  const updatePostLikeCount = async (postId: string): Promise<void> => {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (!error && count !== null) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, like_count: count } : p))
      );
    }
  };

  // 🔄 Update comment count theo giá trị trên bảng posts (DB truth)
  const updatePostCommentCount = async (postId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('posts')
      .select('comment_count')
      .eq('id', postId)
      .maybeSingle();

    if (!error && data) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comment_count: data.comment_count ?? 0 } : p))
      );
    }
  };

  // ❤️ Like/unlike bài viết
  const handleLike = async (postId: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('post_likes').delete().eq('id', existingLike.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
      // Realtime subscription sẽ update UI
    } catch (err) {
      console.error('❌ Error toggling like:', err);
    }
  };

  // 💬 Open comment modal
  const handleOpenComments = async (postId: string): Promise<void> => {
    setSelectedPostId(postId);
    setModalVisible(true);
    await fetchComments(postId);
  };

  // 💬 Fetch comments for a post
  const fetchComments = async (postId: string): Promise<void> => {
    try {
      setLoadingComments(true);
      const data = await PostCommentService.getByPostId(postId);

      if (!data) {
        setComments([]);
        return;
      }

      // Map dữ liệu để khớp type Comment
      const mappedComments: Comment[] = data.map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        profiles:
          c.profiles?.map((p: any) => ({
            id: p.id, // đảm bảo có id
            full_name: p.full_name,
            avatar_url: p.avatar_url,
          })) || null,
      }));

      setComments(mappedComments);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // ✍️ Add new comment
  const handleAddComment = async (): Promise<void> => {
    if (!commentContent.trim() || !selectedPostId || !currentUserId) return;
    try {
      await PostCommentService.create(
        selectedPostId,
        currentUserId,
        commentContent
      );
      setCommentContent('');
      await fetchComments(selectedPostId);
    } catch (error) {
      console.error('❌ Error adding comment:', error);
    }
  };

  // 🔒 Close comment modal
  const handleCloseModal = (): void => {
    setModalVisible(false);
    setSelectedPostId(null);
    setComments([]);
    setCommentContent('');
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
    fetchPosts('initial');

    // 🟢 Realtime posts
    const postsChannel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('✅ New post:', payload.new);
          void fetchPosts('refresh');
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const updatedPost = payload.new as Post;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === updatedPost.id ? { ...p, ...updatedPost } : p
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          const deletedPost = payload.old as { id: string };
          setPosts((prev) => prev.filter((p) => p.id !== deletedPost.id));
        }
      )
      .subscribe();

    // 💬 Realtime comments
    const commentsChannel = supabase
      .channel('public:post_comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        (payload) => {
          const newComment = payload.new as CommentPayload | null;
          const postId = newComment?.post_id;
          if (postId) void updatePostCommentCount(postId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments' },
        (payload) => {
          const oldComment = payload.old as CommentPayload | null;
          const postId = oldComment?.post_id;
          if (postId) void updatePostCommentCount(postId);
        }
      )
      .subscribe();

    // ❤️ Realtime likes
    const likesChannel = supabase
      .channel('public:post_likes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        (payload) => {
          const newLike = payload.new as Partial<LikePayload>;
          if (!newLike?.id || !newLike?.post_id) return;

          setLikePostMap((prev) =>
            new Map(prev).set(newLike.id || '', newLike.post_id!)
          );
          void updatePostLikeCount(newLike.post_id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        (payload) => {
          const oldLike = payload.old as Partial<LikePayload>;
          if (!oldLike?.id) return;

          setLikePostMap((prev) => {
            const postId = prev.get(oldLike.id || '');
            if (!postId) return prev;
            void updatePostLikeCount(postId);
            const newMap = new Map(prev);
            newMap.delete(oldLike.id || '');
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, []);

  const getProfile = (profiles: Profile | Profile[] | null): Profile | null => {
    if (!profiles) return null;
    return Array.isArray(profiles) ? profiles[0] : profiles;
  };

  const renderItem = React.useCallback(({ item }: { item: Post }): React.ReactElement => {
    const profile = getProfile(item.profiles);

    return (
      <View style={styles.card}>
        <View style={styles.userRow}>
          <Image
            source={{
              uri:
                profile?.avatar_url ||
                'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            }}
            style={styles.avatar}
            cache="force-cache"
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {profile?.full_name || 'Ẩn danh'}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <MoreOptionsMenu
            targetType="post"
            targetId={item.id}
            targetName={item.content?.substring(0, 30) + '...'}
            showReport={true}
          />
        </View>

        {item.image_url && (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.postImage}
            cache="force-cache"
          />
        )}
        <Text style={styles.caption}>{item.content}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => void handleLike(item.id)}
          >
            <Heart
              color="#FF8C42"
              size={24}
              fill={item.like_count > 0 ? '#FF8C42' : 'transparent'}
            />
            <Text style={styles.count}>{item.like_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => void handleOpenComments(item.id)}
          >
            <MessageCircle color="#4A90E2" size={24} />
            <Text style={styles.count}>{item.comment_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [likePostMap, currentUserId, handleLike, handleOpenComments]);

  return (
    <View style={styles.container}>
      {/* Compact Header - Logo + Tabs in one row */}
      <View style={styles.headerContainer}>
        <Text style={styles.logoIcon}>🐾</Text>
        
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'community' && styles.tabButtonActive]}
            onPress={() => handleTabChange('community')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'community' && styles.tabButtonTextActive]}>
              Cộng đồng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'chat' && styles.tabButtonActive]}
            onPress={() => handleTabChange('chat')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'chat' && styles.tabButtonTextActive]}>
              Tin nhắn
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/post/create-post')}
        activeOpacity={0.8}
      >
        <Plus color="#FFFFFF" size={28} strokeWidth={3} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.skeletonCard} />
          ))}
        </View>
      ) : (
        <FlatList<Post>
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPosts('refresh')}
            />
          }
          removeClippedSubviews={true}
          windowSize={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={5}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPadding }}
        />
      )}

      {/* 💬 Comment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <X color="#333" size={24} />
            </TouchableOpacity>
          </View>

          {loadingComments ? (
            <ActivityIndicator
              size="large"
              color="#FF5A75"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const profile = getProfile(item.profiles);
                return (
                  <View style={styles.commentCard}>
                    <Image
                      source={{
                        uri:
                          profile?.avatar_url ||
                          'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                      }}
                      style={styles.commentAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentUser}>
                        {profile?.full_name || 'Ẩn danh'}
                      </Text>
                      <Text style={styles.commentText}>{item.content}</Text>
                      <Text style={styles.commentTime}>
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyComment}>Chưa có bình luận nào</Text>
              }
              contentContainerStyle={styles.commentList}
            />
          )}

          <View style={styles.commentInputContainer}>
            <TextInput
              placeholder="Viết bình luận của bạn..."
              value={commentContent}
              onChangeText={setCommentContent}
              style={styles.commentInput}
              multiline
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => void handleAddComment()}
              disabled={!commentContent.trim()}
              style={[
                styles.sendButton,
                !commentContent.trim() && styles.sendButtonDisabled,
              ]}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

/* ============================================================
   🎨 StyleSheet
   ============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 10,
    paddingHorizontal: 16,
    gap: 12,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  postImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#f0f0f0',
  },
  caption: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  count: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    right: 24,
    backgroundColor: '#FF6B6B',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  commentList: {
    padding: 16,
    flexGrow: 1,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  commentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commentUser: {
    fontWeight: '700',
    fontSize: 15,
    color: '#000',
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
  },
  commentTime: {
    fontSize: 11,
    color: '#999',
  },
  emptyComment: {
    textAlign: 'center',
    color: '#999',
    marginTop: 60,
    fontSize: 15,
  },
  commentInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 0,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF6B6B',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    height: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    marginBottom: 16,
  },
});

export default CommunityScreen;
