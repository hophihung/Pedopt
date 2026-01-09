export { ChatService } from './services/chat.service';
export { TransactionService } from './services/transaction.service';
export { ChatList } from './components/ChatList';
export { ChatScreen } from './components/ChatScreen';
export { TransactionCard } from './components/TransactionCard';
export { ReputationBadge, AvatarFrame, getReputationTier } from './components/ReputationBadge';
export { NewMatchesSection } from './components/NewMatchesSection';
export { SwipeableConversationItem } from './components/SwipeableConversationItem';
export { useUnreadCount } from './hooks/useUnreadCount';
export { useNewMatches } from './hooks/useNewMatches';
export { useHiddenConversations } from './hooks/useHiddenConversations';

export type { Conversation, Message, Notification } from './services/chat.service';
export type { Transaction } from './services/transaction.service';
