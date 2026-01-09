import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

export function useHiddenConversations() {
  const { user } = useAuth();
  const [hiddenConversations, setHiddenConversations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load hidden conversations from AsyncStorage
  const loadHiddenConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const key = `hidden_conversations_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const hiddenIds = JSON.parse(stored) as string[];
        setHiddenConversations(new Set(hiddenIds));
      }
    } catch (error) {
      console.error('Error loading hidden conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Save hidden conversations to AsyncStorage
  const saveHiddenConversations = useCallback(async (hiddenIds: Set<string>) => {
    if (!user?.id) return;

    try {
      const key = `hidden_conversations_${user.id}`;
      const array = Array.from(hiddenIds);
      await AsyncStorage.setItem(key, JSON.stringify(array));
    } catch (error) {
      console.error('Error saving hidden conversations:', error);
    }
  }, [user?.id]);

  // Hide a conversation (client-side only)
  const hideConversation = useCallback(async (conversationId: string) => {
    const newHidden = new Set(hiddenConversations);
    newHidden.add(conversationId);
    
    setHiddenConversations(newHidden);
    await saveHiddenConversations(newHidden);
    
    console.log(`🗑️ Hidden conversation: ${conversationId} (client-side only)`);
  }, [hiddenConversations, saveHiddenConversations]);

  // Unhide a conversation
  const unhideConversation = useCallback(async (conversationId: string) => {
    const newHidden = new Set(hiddenConversations);
    newHidden.delete(conversationId);
    
    setHiddenConversations(newHidden);
    await saveHiddenConversations(newHidden);
    
    console.log(`↩️ Unhidden conversation: ${conversationId}`);
  }, [hiddenConversations, saveHiddenConversations]);

  // Check if conversation is hidden
  const isConversationHidden = useCallback((conversationId: string) => {
    return hiddenConversations.has(conversationId);
  }, [hiddenConversations]);

  // Filter out hidden conversations from a list
  const filterVisibleConversations = useCallback(<T extends { id: string }>(conversations: T[]) => {
    return conversations.filter(conv => !hiddenConversations.has(conv.id));
  }, [hiddenConversations]);

  // Clear all hidden conversations
  const clearAllHidden = useCallback(async () => {
    setHiddenConversations(new Set());
    await saveHiddenConversations(new Set());
    
    console.log('🧹 Cleared all hidden conversations');
  }, [saveHiddenConversations]);

  // Get hidden conversations count
  const hiddenCount = hiddenConversations.size;

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadHiddenConversations();
    }
  }, [user?.id, loadHiddenConversations]);

  return {
    hiddenConversations,
    loading,
    hideConversation,
    unhideConversation,
    isConversationHidden,
    filterVisibleConversations,
    clearAllHidden,
    hiddenCount,
    refreshHiddenConversations: loadHiddenConversations,
  };
}