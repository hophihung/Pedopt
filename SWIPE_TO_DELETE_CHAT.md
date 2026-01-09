# Swipe to Delete Chat - Tính năng xóa conversation

## 🎯 Mục tiêu
Cho phép người dùng swipe từ phải sang trái để xóa conversation khỏi danh sách chat của họ (chỉ ẩn ở phía client, không xóa thật trên hệ thống).

## ✅ Tính năng đã thực hiện

### 1. **SwipeableConversationItem Component**
```typescript
// Component conversation có thể swipe để xóa
<SwipeableConversationItem
  conversation={item}
  otherUser={otherUser}
  unreadCount={unreadCount}
  hasUnread={hasUnread}
  onPress={() => handleConversationSelect(item)}
  onDelete={() => handleDeleteConversation(item)}
/>
```

**Tính năng:**
- **Swipe từ phải sang trái** để hiển thị nút xóa
- **PanResponder** để handle gesture
- **Smooth animation** khi swipe
- **Snap back** nếu swipe không đủ xa
- **Visual feedback** với background đỏ và icon trash

### 2. **useHiddenConversations Hook**
```typescript
const {
  hiddenConversations,        // Set các conversation đã ẩn
  hideConversation,           // Function để ẩn conversation
  unhideConversation,         // Function để bỏ ẩn
  isConversationHidden,       // Check conversation có bị ẩn không
  filterVisibleConversations, // Filter ra conversations visible
  hiddenCount,                // Số lượng conversation đã ẩn
} = useHiddenConversations();
```

**Persistence:**
- Lưu trữ trong **AsyncStorage** theo user
- Key: `hidden_conversations_${userId}`
- Data: Array các conversation IDs đã ẩn

### 3. **Toggle Show/Hide Hidden Conversations**
```typescript
// Button để toggle hiển thị conversations đã ẩn
{hiddenCount > 0 && (
  <TouchableOpacity onPress={() => setShowHidden(!showHidden)}>
    {showHidden ? <EyeOff /> : <Eye />}
    <NotificationBadge count={hiddenCount} />
  </TouchableOpacity>
)}
```

**UI Features:**
- **Eye icon** để toggle show/hide
- **Badge số** hiển thị số conversation đã ẩn
- **Info banner** khi đang xem hidden conversations

## 🔧 Technical Implementation

### **Swipe Gesture Handling:**
```typescript
const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: (evt, gestureState) => {
    // Chỉ respond với horizontal swipes
    return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
  },
  onPanResponderMove: (evt, gestureState) => {
    // Chỉ cho phép swipe trái (negative dx)
    if (gestureState.dx < 0) {
      translateX.setValue(gestureState.dx);
    }
  },
  onPanResponderRelease: (evt, gestureState) => {
    if (gestureState.dx < -SWIPE_THRESHOLD) {
      // Trigger delete action
      onDelete();
    } else {
      // Snap back to center
      resetSwipe();
    }
  },
});
```

### **Animation System:**
```typescript
// Smooth slide animation
Animated.timing(translateX, {
  toValue: -ACTION_WIDTH,
  duration: 200,
  useNativeDriver: true,
}).start();

// Spring back animation
Animated.spring(translateX, {
  toValue: 0,
  useNativeDriver: true,
  tension: 100,
  friction: 8,
}).start();
```

### **Client-side Storage:**
```typescript
// Save hidden conversations
const saveHiddenConversations = async (hiddenIds: Set<string>) => {
  const key = `hidden_conversations_${user.id}`;
  const array = Array.from(hiddenIds);
  await AsyncStorage.setItem(key, JSON.stringify(array));
};

// Load hidden conversations
const loadHiddenConversations = async () => {
  const key = `hidden_conversations_${user.id}`;
  const stored = await AsyncStorage.getItem(key);
  if (stored) {
    const hiddenIds = JSON.parse(stored) as string[];
    setHiddenConversations(new Set(hiddenIds));
  }
};
```

## 🎨 User Experience

### **Swipe Flow:**
1. **User swipes left** trên conversation
2. **Red background** hiển thị với trash icon
3. **Confirmation dialog** xuất hiện
4. **Conversation disappears** khỏi danh sách
5. **Eye icon** xuất hiện nếu có hidden conversations

### **Confirmation Dialog:**
```typescript
Alert.alert(
  'Xóa cuộc trò chuyện',
  `Bạn có chắc muốn xóa cuộc trò chuyện với ${userName}?\n\nLưu ý: Cuộc trò chuyện chỉ bị ẩn khỏi danh sách của bạn, không bị xóa hoàn toàn.`,
  [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: () => hideConversation(conversationId) }
  ]
);
```

### **Visual States:**
- **Normal state**: Conversation hiển thị bình thường
- **Swiping state**: Background đỏ với trash icon
- **Hidden state**: Conversation không hiển thị trong danh sách
- **Show hidden state**: Hiển thị tất cả conversations với info banner

## 🔒 Data Safety

### **Client-side Only:**
- ❌ **KHÔNG xóa** conversation trên server
- ❌ **KHÔNG ảnh hưởng** đến người dùng khác
- ✅ **CHỈ ẩn** khỏi danh sách của user hiện tại
- ✅ **Có thể khôi phục** bằng cách toggle show hidden

### **Persistence:**
- Lưu trữ trong **AsyncStorage** của device
- **Per-user** storage với user ID
- **Sync across app sessions** nhưng không sync across devices
- **Manual backup/restore** có thể implement sau

## 🚀 Performance

### **Optimizations:**
- **useNativeDriver: true** cho smooth animations
- **Efficient filtering** với Set data structure
- **Lazy loading** hidden conversations chỉ khi cần
- **Minimal re-renders** với proper memoization

### **Memory Management:**
- **Cleanup** pan responder khi component unmount
- **Reset animations** khi swipe cancelled
- **Efficient state updates** với functional updates

## 🔮 Future Enhancements

1. **Bulk operations** - Select multiple conversations để hide
2. **Swipe right** cho archive functionality
3. **Undo action** - Toast với button "Hoàn tác"
4. **Auto-hide** conversations sau X ngày không hoạt động
5. **Sync hidden state** across devices qua server
6. **Custom swipe actions** - Pin, mute, mark as important
7. **Haptic feedback** khi swipe thành công
8. **Sound effects** cho swipe actions

## 📱 Platform Compatibility

### **iOS:**
- ✅ Smooth PanResponder gestures
- ✅ Native-like swipe behavior
- ✅ Proper safe area handling

### **Android:**
- ✅ Gesture handling works correctly
- ✅ Material Design feedback
- ✅ Back button behavior preserved

---

**Tóm tắt**: Tính năng swipe to delete đã được implement hoàn chỉnh với UX mượt mà, data safety cao, và performance tối ưu. Người dùng có thể dễ dàng ẩn conversations không mong muốn mà không lo mất dữ liệu.