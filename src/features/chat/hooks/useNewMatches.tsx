import { useState, useEffect, useCallback } from 'react';
import { ChatService, Conversation } from '../services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NewMatch extends Conversation {
  isNew: boolean;
  matchedAt: string;
}

export function useNewMatches() {
  const { user } = useAuth();
  const [newMatches, setNewMatches] = useState<NewMatch[]>([]);
  const [loading, setLoading] = useState(false);

  // Load new matches (conversations created in last 24 hours that user hasn't seen)
  const loadNewMatches = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get all conversations
      const conversations = await ChatService.getConversations(user.id);
      
      // Get last seen timestamp
      const lastSeenKey = `last_seen_matches_${user.id}`;
      const lastSeenStr = await AsyncStorage.getItem(lastSeenKey);
      const lastSeen = lastSeenStr ? new Date(lastSeenStr) : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Filter new matches
      const newMatchesData = conversations
        .filter(conv => {
          const createdAt = new Date(conv.created_at);
          return createdAt > lastSeen;
        })
        .map(conv => ({
          ...conv,
          isNew: true,
          matchedAt: conv.created_at,
        }))
        .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime());

      setNewMatches(newMatchesData);
    } catch (error) {
      console.error('Error loading new matches:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark matches as seen
  const markMatchesAsSeen = useCallback(async () => {
    if (!user?.id) return;

    try {
      const lastSeenKey = `last_seen_matches_${user.id}`;
      await AsyncStorage.setItem(lastSeenKey, new Date().toISOString());
      
      // Clear new matches
      setNewMatches([]);
    } catch (error) {
      console.error('Error marking matches as seen:', error);
    }
  }, [user?.id]);

  // Remove specific match from new matches
  const removeNewMatch = useCallback((conversationId: string) => {
    setNewMatches(prev => prev.filter(match => match.id !== conversationId));
  }, []);

  // Subscribe to real-time new conversations
  useEffect(() => {
    if (!user?.id) return;

    const subscription = ChatService.subscribeToConversationList(
      user.id,
      (conversation) => {
        // Check if this is a new conversation
        const now = new Date();
        const createdAt = new Date(conversation.created_at);
        const isRecent = (now.getTime() - createdAt.getTime()) < 5 * 60 * 1000; // 5 minutes

        if (isRecent && conversation.is_active) {
          const newMatch: NewMatch = {
            ...conversation,
            isNew: true,
            matchedAt: conversation.created_at,
          };

          setNewMatches(prev => {
            // Check if already exists
            const exists = prev.some(match => match.id === conversation.id);
            if (exists) return prev;

            // Add to beginning of array
            return [newMatch, ...prev];
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadNewMatches();
    }
  }, [user?.id, loadNewMatches]);

  return {
    newMatches,
    loading,
    loadNewMatches,
    markMatchesAsSeen,
    removeNewMatch,
    hasNewMatches: newMatches.length > 0,
    newMatchesCount: newMatches.length,
  };
}