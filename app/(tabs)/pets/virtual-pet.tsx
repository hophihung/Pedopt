import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, TrendingUp, Heart, Star, Sparkles, ArrowLeft, Gamepad2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useVirtualPet } from '@/src/features/virtualPet/hooks/useVirtualPet';
import { LevelUpModal, petColors, petEmojis, PetSelectionModal, PetType } from '@/src/features/virtualPet';
import { CheckinCalendar } from '@/src/features/virtualPet/components/CheckinCalendar';
import { PixelPetAnimation } from '@/src/features/virtualPet/components/PixelPetAnimation';
import { MiniGame } from '@/src/features/virtualPet/components/MiniGame';
import { PetInteractions } from '@/src/features/virtualPet/components/PetInteractions';
import { getEvolutionStageName, getEvolutionStage } from '@/src/config/virtualPet/animations';
import { GamerBackground } from '@/src/components/backgrounds/GamerBackground';
import { Header } from '@/src/components/Header';
import { colors } from '@/src/theme/colors';



export default function VirtualPetScreen() {
  const router = useRouter();
  const {
    virtualPet,
    loading,
    error,
    checkingIn,
    hasCheckedInToday,
    daysSinceLastCheckin,
    expProgress,
    currentMoodState,
    createVirtualPet,
    dailyCheckin,
    fetchVirtualPet,
    hasVirtualPet,
    feedPet,
    playWithPet,
    cleanPet,
    miniGameReward,
  } = useVirtualPet();

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [showCheckinCalendar, setShowCheckinCalendar] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);

  // Track level changes
  useEffect(() => {
    if (virtualPet && virtualPet.level > previousLevel) {
      setShowLevelUpModal(true);
      setPreviousLevel(virtualPet.level);
    }
  }, [virtualPet?.level]);

  const handleDailyCheckin = async () => {
    try {
      const result = await dailyCheckin();
      if (result?.success) {
        if (result.level_up) {
          // Level up modal will be shown by useEffect
        } else {
          Alert.alert('Điểm danh thành công!', `+${result.exp_gain} EXP, +${result.mood_gain} Mood 🎉`);
        }
      } else {
        Alert.alert('Lỗi', result?.error || 'Không thể điểm danh');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể điểm danh. Vui lòng thử lại.');
    }
  };

  const handleCreatePet = async (petType: PetType, name: string) => {
    try {
      await createVirtualPet({ pet_type: petType, name });
      setShowPetSelection(false);
      Alert.alert('Thành công!', `Đã tạo ${name}! 🎉`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo pet';
      Alert.alert('Lỗi', message);
    }
  };

  if (loading && !virtualPet) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!hasVirtualPet) {
    return (
      <View style={styles.container}>
        <Header 
          title="Virtual Pet"
          showBack={true}
          onBack={() => router.replace('/(tabs)/pets/my-pets')}
        />

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>Chưa có Virtual Pet</Text>
          <Text style={styles.emptyDescription}>
            Tạo một virtual pet của riêng bạn và chăm sóc nó hàng ngày!
          </Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowPetSelection(true)}
          >
            <LinearGradient
              colors={['#FF6B9D', '#FF8E53']}
              style={styles.createButtonGradient}
            >
              <Sparkles size={20} color="#FFF" />
              <Text style={styles.createButtonText}>Tạo Virtual Pet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <PetSelectionModal
          visible={showPetSelection}
          onClose={() => setShowPetSelection(false)}
          onSelect={handleCreatePet}
        />
      </View>
    );
  }

  if (!virtualPet) return null;

  const colors = petColors[virtualPet.pet_type];
  const moodColor = virtualPet.mood >= 80 ? '#34C759' : virtualPet.mood >= 50 ? '#FF9500' : '#FF3B30';

  return (
    <GamerBackground intensity="medium">
      <View style={styles.container}>
        {/* Header */}
        <Header 
          title={virtualPet.name}
          showBack={true}
          onBack={() => router.replace('/(tabs)/pets/my-pets')}
          rightActions={
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowCheckinCalendar(true)}
              activeOpacity={0.7}
            >
              <View style={styles.calendarButtonBadge}>
                <Calendar size={20} color="#FF6B6B" />
                <Text style={styles.calendarButtonText}>{virtualPet.streak_days}</Text>
              </View>
            </TouchableOpacity>
          }
        />

        {/* Pet Info Subtitle */}
        <View style={styles.petInfoContainer}>
          <Text style={styles.petInfoText}>
            {petEmojis[virtualPet.pet_type]} Level {virtualPet.level} • {getEvolutionStageName(getEvolutionStage(virtualPet.level))}
          </Text>
        </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Display */}
        <View style={styles.petContainer}>
          <View style={styles.petBackground}>
            <View style={styles.petGlow} />
            <PixelPetAnimation
              petType={virtualPet.pet_type}
              mood={currentMoodState}
              level={virtualPet.level}
              size={180}
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* EXP Bar */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.statTitle}>Kinh nghiệm</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={[styles.progressFill, { width: `${expProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {virtualPet.exp} / {virtualPet.exp_to_next_level} EXP
              </Text>
            </View>
          </View>

          {/* Mood Bar */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Heart size={20} color={moodColor} />
              <Text style={styles.statTitle}>Cảm xúc</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${virtualPet.mood}%`,
                      backgroundColor: moodColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: moodColor }]}>
                {virtualPet.mood} / 100
              </Text>
            </View>
          </View>

          {/* Streak */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.statTitle}>Chuỗi điểm danh</Text>
            </View>
            <Text style={styles.streakText}>{virtualPet.streak_days} ngày liên tiếp 🔥</Text>
            {daysSinceLastCheckin > 0 && (
              <Text style={styles.warningText}>
                {daysSinceLastCheckin} ngày chưa điểm danh
              </Text>
            )}
          </View>

          {/* Evolution Info */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Sparkles size={20} color={colors.primary} />
              <Text style={styles.statTitle}>Tiến hóa</Text>
            </View>
            <Text style={styles.evolutionText}>
              {getEvolutionStageName(getEvolutionStage(virtualPet.level))}
            </Text>
            {virtualPet.level < 50 && (
              <Text style={styles.evolutionNextText}>
                Tiến hóa tiếp: Level {virtualPet.level < 10 ? 10 : virtualPet.level < 30 ? 30 : 50}
              </Text>
            )}
            {virtualPet.level >= 50 && (
              <Text style={styles.evolutionMaxText}>
                ✨ Đã đạt level tối đa!
              </Text>
            )}
          </View>
        </View>

        {/* Pet Interactions */}
        <View style={styles.interactionsContainer}>
          <PetInteractions
            onFeed={async () => {
              const result = await feedPet();
              return { 
                success: result.success, 
                exp_gain: result.exp_gain || 0, 
                mood_gain: result.mood_gain || 0,
                error: result.error 
              };
            }}
            onPlay={async () => {
              const result = await playWithPet();
              if (result.success && result.pet) {
                // Pet will be updated via hook, which will trigger re-render
              }
              return { 
                success: result.success, 
                exp_gain: result.exp_gain || 0, 
                mood_gain: result.mood_gain || 0,
                error: result.error 
              };
            }}
            onClean={async () => {
              const result = await cleanPet();
              return { 
                success: result.success, 
                mood_gain: result.mood_gain || 0,
                error: result.error 
              };
            }}
            lastFeedDate={virtualPet.last_feed_date}
            lastCleanDate={virtualPet.last_clean_date}
            lastPlayTime={virtualPet.last_play_time}
          />
        </View>

        {/* Mini Game Button */}
        <TouchableOpacity
          style={styles.miniGameButton}
          onPress={() => setShowMiniGame(true)}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.miniGameButtonGradient}
          >
            <Gamepad2 size={24} color="#FFF" />
            <Text style={styles.miniGameButtonText}>Mini Game 🎮</Text>
            <Text style={styles.miniGameButtonSubtext}>Kiếm EXP thêm!</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Daily Check-in Button */}
        <TouchableOpacity
          style={[
            styles.checkinButton,
            (hasCheckedInToday || checkingIn) && styles.checkinButtonDisabled,
          ]}
          onPress={handleDailyCheckin}
          disabled={hasCheckedInToday || checkingIn}
        >
          <LinearGradient
            colors={
              hasCheckedInToday || checkingIn
                ? ['#CCC', '#BBB']
                : [colors.primary, colors.secondary]
            }
            style={styles.checkinButtonGradient}
          >
            {checkingIn ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Calendar size={24} color="#FFF" />
                <Text style={styles.checkinButtonText}>
                  {hasCheckedInToday
                    ? 'Đã điểm danh hôm nay ✓'
                    : 'Điểm danh hôm nay 🐾'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Star size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              Điểm danh mỗi ngày để nhận +50 EXP và +10 Mood!
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Heart size={18} color="#FF3B30" />
            <Text style={styles.infoText}>
              Nếu không điểm danh hơn 2 ngày, Mood sẽ giảm -20 mỗi ngày
            </Text>
          </View>
        </View>

        {/* Bottom Back Button */}
        <TouchableOpacity
          style={styles.bottomBackButton}
          onPress={() => router.replace('/(tabs)/pets/my-pets')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.bottomBackButtonGradient}
          >
            <ArrowLeft size={20} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.bottomBackButtonText}>Quay lại danh sách Pet</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Level Up Modal */}
      {virtualPet && (
        <LevelUpModal
          visible={showLevelUpModal}
          level={virtualPet.level}
          onClose={() => setShowLevelUpModal(false)}
          petEmoji={petEmojis[virtualPet.pet_type]}
        />
      )}

      {/* Pet Selection Modal */}
      <PetSelectionModal
        visible={showPetSelection}
        onClose={() => setShowPetSelection(false)}
        onSelect={handleCreatePet}
      />

      {/* Checkin Calendar Modal */}
      {virtualPet && (
        <CheckinCalendar
          visible={showCheckinCalendar}
          onClose={() => setShowCheckinCalendar(false)}
          streakDays={virtualPet.streak_days}
          hasCheckedInToday={hasCheckedInToday}
          petType={virtualPet.pet_type}
        />
      )}

      {/* Mini Game Modal */}
      {virtualPet && (
        <MiniGame
          visible={showMiniGame}
          onClose={() => setShowMiniGame(false)}
          onComplete={async (expGain) => {
            try {
              const result = await miniGameReward(expGain);
              if (!result.success && result.error) {
                Alert.alert('Thông báo', result.error);
                setShowMiniGame(false);
              } else if (result.success) {
                // Pet will be updated via hook, which will trigger re-render
              }
            } catch (error) {
              console.error('Error rewarding mini game:', error);
            }
          }}
          canPlayToday={(() => {
            if (!virtualPet.last_minigame_date) return true;
            const today = new Date().toISOString().split('T')[0];
            const lastMinigame = new Date(virtualPet.last_minigame_date).toISOString().split('T')[0];
            return today !== lastMinigame;
          })()}
          onPlayToday={() => {
            // This will be handled by the service when reward is given
            // The date will be set when miniGameReward is called
          }}
        />
      )}
      </View>
    </GamerBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  petInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  petInfoText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 12,
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  calendarButtonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 130 : 110, // Đẩy lên cao để không bị che bởi bottom tab bar
    paddingTop: 0, // Bỏ padding top vì đã có Header component
  },
  petContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  petBackground: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  petGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#6366F1',
    opacity: 0.2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  evolutionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  evolutionNextText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  evolutionMaxText: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '600',
  },
  checkinButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkinButtonDisabled: {
    opacity: 0.6,
  },
  checkinButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  checkinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  infoContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 100,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  interactionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  miniGameButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  miniGameButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  miniGameButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  miniGameButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  bottomBackButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomBackButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bottomBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

