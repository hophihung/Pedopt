import { useState, useEffect, useCallback } from 'react';
import { ChatService } from '../services/chat.service';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadCount() {
  const { user } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);

  // Load total unread count
  const loadTotalUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const count = await ChatService.getTotalUnreadCount(user.id);
      setTotalUnreadCount(count);
    } catch (error) {
      console.error('Error loading total unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load unread count for specific conversation
  const loadConversationUnreadCount = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const count = await ChatService.getUnreadCount(conversationId, user.id);
      setConversationUnreadCounts(prev => ({
        ...prev,
        [conversationId]: count
      }));
    } catch (error) {
      console.error('Error loading conversation unread count:', error);
    }
  }, [user?.id]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await ChatService.markAsRead(conversationId, user.id);
      
      // Update local state
      const previousCount = conversationUnreadCounts[conversationId] || 0;
      setConversationUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
      
      // Update total count
      setTotalUnreadCount(prev => Math.max(0, prev - previousCount));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [user?.id, conversationUnreadCounts]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new messages
    const subscription = ChatService.subscribeToConversationList(
      user.id,
      (conversation) => {
        // Reload unread counts when conversation updates
        loadTotalUnreadCount();
        if (conversation.id) {
          loadConversationUnreadCount(conversation.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadTotalUnreadCount, loadConversationUnreadCount]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadTotalUnreadCount();
    }
  }, [user?.id, loadTotalUnreadCount]);

  return {
    totalUnreadCount,
    conversationUnreadCounts,
    loading,
    loadTotalUnreadCount,
    loadConversationUnreadCount,
    markConversationAsRead,
    refreshUnreadCounts: loadTotalUnreadCount,
  };
}