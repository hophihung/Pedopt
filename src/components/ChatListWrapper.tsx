import React, { memo } from 'react';
import { ChatListEnhanced, ChatListRef } from '@/src/features/chat/components/ChatListEnhanced';
import { Conversation } from '@/src/features/chat';

interface ChatListWrapperProps {
  chatListRef: React.RefObject<ChatListRef>;
  onConversationSelect: (conversation: Conversation) => void;
  cachedData: any;
  onDataChange: (data: any) => void;
  initialScrollPosition: number;
}

export const ChatListWrapper = memo<ChatListWrapperProps>(({
  chatListRef,
  onConversationSelect,
  cachedData,
  onDataChange,
  initialScrollPosition
}) => {
  return (
    <ChatListEnhanced 
      ref={chatListRef}
      onConversationSelect={onConversationSelect}
      cachedData={cachedData}
      onDataChange={onDataChange}
      initialScrollPosition={initialScrollPosition}
    />
  );
});

ChatListWrapper.displayName = 'ChatListWrapper';