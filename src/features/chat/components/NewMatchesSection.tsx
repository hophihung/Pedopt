import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Heart, Sparkles } from 'lucide-react-native';
import { useNewMatches } from '../hooks/useNewMatches';
import { NotificationBadge } from '@/src/components/NotificationBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NewMatchesSectionProps {
  onMatchPress: (conversationId: string) => void;
  onSeeAllPress?: () => void;
}

export function NewMatchesSection({ onMatchPress, onSeeAllPress }: NewMatchesSectionProps) {
  const { newMatches, hasNewMatches, markMatchesAsSeen } = useNewMatches();

  if (!hasNewMatches) {
    return null;
  }

  const handleMatchPress = (conversationId: string) => {
    onMatchPress(conversationId);
    // Optionally mark this specific match as seen
  };

  const handleSeeAll = () => {
    markMatchesAsSeen();
    onSeeAllPress?.();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={20} color="#FF6B6B" />
          <Text style={styles.title}>Match mới</Text>
          <NotificationBadge count={newMatches.length} size="small" />
        </View>
        
        {newMatches.length > 3 && (
          <TouchableOpacity onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Matches List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.matchesList}
        style={styles.scrollView}
      >
        {newMatches.slice(0, 10).map((match) => {
          const otherUser = match.buyer_id !== match.seller_id 
            ? (match.buyer?.id === match.buyer_id ? match.seller : match.buyer)
            : match.buyer;

          return (
            <TouchableOpacity
              key={match.id}
              style={styles.matchItem}
              onPress={() => handleMatchPress(match.id)}
              activeOpacity={0.8}
            >
              {/* Avatar with border */}
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: otherUser?.avatar_url || 'https://via.placeholder.com/80',
                  }}
                  style={styles.avatar}
                />
                
                {/* New match indicator */}
                <View style={styles.newIndicator}>
                  <Heart size={12} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>

              {/* Name */}
              <Text style={styles.matchName} numberOfLines={1}>
                {otherUser?.full_name || 'Unknown'}
              </Text>

              {/* Pet info */}
              {match.pet && (
                <Text style={styles.petInfo} numberOfLines={1}>
                  {match.pet.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  scrollView: {
    marginHorizontal: -4,
  },
  matchesList: {
    paddingHorizontal: 4,
    gap: 16,
  },
  matchItem: {
    alignItems: 'center',
    width: 80,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F2F5',
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  newIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  matchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  petInfo: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});