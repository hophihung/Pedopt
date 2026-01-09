import { useState, useEffect, useCallback } from 'react';
import { ChatService } from '@/src/features/chat/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';

interface MatchNotification {
  id: string;
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
  conversationId: string;
  timestamp: string;
}

export function useMatchNotifications() {
  const { user } = useAuth();
  const [currentNotification, setCurrentNotification] = useState<MatchNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<MatchNotification[]>([]);

  // Show next notification from queue
  const showNextNotification = useCallback(() => {
    if (notificationQueue.length > 0 && !currentNotification) {
      const [next, ...rest] = notificationQueue;
      setCurrentNotification(next);
      setNotificationQueue(rest);
    }
  }, [notificationQueue, currentNotification]);

  // Add notification to queue
  const addNotification = useCallback((notification: MatchNotification) => {
    setNotificationQueue(prev => [...prev, notification]);
  }, []);

  // Close current notification
  const closeNotification = useCallback(() => {
    setCurrentNotification(null);
    // Show next notification after a delay
    setTimeout(showNextNotification, 500);
  }, [showNextNotification]);

  // Handle new conversation (potential match)
  const handleNewConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      // Get conversation details
      const conversations = await ChatService.getConversations(user.id);
      const newConversation = conversations.find(conv => conv.id === conversationId);

      if (!newConversation) return;

      // Check if this is a recent conversation (within last 5 minutes)
      const now = new Date();
      const createdAt = new Date(newConversation.created_at);
      const isRecent = (now.getTime() - createdAt.getTime()) < 5 * 60 * 1000;

      if (isRecent && newConversation.pet && newConversation.buyer && newConversation.seller) {
        const otherUser = user.id === newConversation.buyer_id 
          ? newConversation.seller 
          : newConversation.buyer;

        if (otherUser) {
          const notification: MatchNotification = {
            id: conversationId,
            matchedUser: {
              id: otherUser.id,
              full_name: otherUser.full_name || 'Unknown User',
              avatar_url: otherUser.avatar_url || 'https://via.placeholder.com/80',
            },
            pet: {
              id: newConversation.pet.id,
              name: newConversation.pet.name,
              images: Array.isArray(newConversation.pet.images) 
                ? newConversation.pet.images 
                : [newConversation.pet.images || 'https://via.placeholder.com/80'],
            },
            conversationId,
            timestamp: newConversation.created_at,
          };

          addNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error handling new conversation:', error);
    }
  }, [user?.id, addNotification]);

  // Subscribe to new conversations
  useEffect(() => {
    if (!user?.id) return;

    const subscription = ChatService.subscribeToConversationList(
      user.id,
      (conversation) => {
        if (conversation.id) {
          handleNewConversation(conversation.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, handleNewConversation]);

  // Show next notification when queue changes
  useEffect(() => {
    showNextNotification();
  }, [showNextNotification]);

  return {
    currentNotification,
    hasNotification: !!currentNotification,
    closeNotification,
    addNotification,
  };
}