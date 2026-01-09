# Cải thiện Spacing và Layout - Match Screen

## Vấn đề đã sửa:
- Các nút trong tab layout bị dính nhau
- Action buttons bị dính nhau trên mobile
- Hình pet cần nhích lên gần header hơn

## Những cải thiện đã thực hiện:

### 1. **Tab Layout Spacing**
```typescript
// Trước:
mainTabs: {
  padding: 4,
  gap: 4,
}
mainTabButton: {
  paddingVertical: 12,
  paddingHorizontal: 20,
  gap: 8,
}

// Sau:
mainTabs: {
  padding: 6,        // Tăng từ 4px lên 6px
  gap: 8,           // Tăng từ 4px lên 8px
}
mainTabButton: {
  paddingVertical: 14,   // Tăng từ 12px lên 14px
  paddingHorizontal: 24, // Tăng từ 20px lên 24px
  gap: 10,              // Tăng từ 8px lên 10px
}
```

### 2. **Explore Icon Button**
```typescript
// Trước:
exploreIconButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
}

// Sau:
exploreIconButton: {
  width: 48,         // Tăng từ 44px lên 48px
  height: 48,        // Tăng từ 44px lên 48px
  borderRadius: 24,  // Tăng từ 22px lên 24px
}
```

### 3. **Card Container - Đẩy pet lên gần header**
```typescript
// Trước:
cardContainer: { 
  marginBottom: 10,
  paddingTop: 5, 
  paddingBottom: 34,
}

// Sau:
cardContainer: { 
  paddingTop: 3,     // Giảm từ 5px xuống 3px (gần header hơn)
  paddingBottom: 20, // Giảm từ 34px xuống 20px
  // Loại bỏ marginBottom: 10
}
```

### 4. **Action Buttons Spacing**
```typescript
// Trước:
actions: {
  gap: 12,
  paddingVertical: 20,
}

// Sau:
actions: {
  gap: 16,              // Tăng từ 12px lên 16px
  paddingVertical: 24,  // Tăng từ 20px lên 24px
}
```

### 5. **Icon Sizes đồng bộ**
```typescript
// Empty State và Main State đều dùng:
<Heart size={24} />      // Thay vì 20px
<Star size={24} />       // Thay vì 20px  
<Grid3x3 size={26} />    // Thay vì 22px
```

## Kết quả:
- ✅ **Tab buttons** không còn bị dính nhau
- ✅ **Action buttons** có spacing thoải mái hơn
- ✅ **Pet card** gần header hơn 2px (từ 5px xuống 3px)
- ✅ **Touch targets** lớn hơn, dễ bấm hơn trên mobile
- ✅ **Visual hierarchy** rõ ràng hơn
- ✅ **Consistent spacing** trên toàn bộ UI

## Spacing Values Summary:
- **Tab container padding**: 6px
- **Tab button gap**: 8px  
- **Tab button padding**: 14px vertical, 24px horizontal
- **Icon gap**: 10px
- **Card padding top**: 3px (gần header)
- **Action buttons gap**: 16px
- **Action buttons padding**: 24px vertical
- **Explore button size**: 48x48px

## Mobile Optimization:
- Touch targets đủ lớn (48x48px minimum)
- Spacing thoải mái cho ngón tay
- Visual separation rõ ràng
- Không bị overlap trên các màn hình nhỏ