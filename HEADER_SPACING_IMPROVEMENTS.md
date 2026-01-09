# Cải thiện Header Spacing cho tất cả Tabs

## Vấn đề đã giải quyết:
- Header của các tab bị dính vào nội dung bên dưới
- Thiếu khoảng cách và shadow cho header
- Không có spacing nhất quán giữa các tab

## Những cải thiện đã thực hiện:

### 1. **Explore Tab** (`/app/(tabs)/discover/explore.tsx`)
- ✅ Tăng `paddingBottom` từ 12px lên 20px
- ✅ Thêm `marginBottom: 8px` cho header
- ✅ Thêm `paddingTop: 12px` cho scroll content
- ✅ Cải thiện shadow và elevation

### 2. **Match Tab** (`/app/(tabs)/discover/match.tsx`)
- ✅ Tăng `paddingBottom` từ 10px lên 20px
- ✅ Thêm `marginBottom: 8px` cho header
- ✅ Thêm shadow và elevation

### 3. **My Pets Tab** (`/app/(tabs)/pets/my-pets.tsx`)
- ✅ Tăng `paddingBottom` từ 10px lên 20px
- ✅ Thêm `marginBottom: 8px` cho header
- ✅ Thêm shadow và elevation

### 4. **Chat Tab** (`/app/(tabs)/social/chat.tsx`)
- ✅ Tăng `paddingBottom` từ 10px lên 20px
- ✅ Thêm `marginBottom: 8px` cho header
- ✅ Thêm shadow và elevation

### 5. **Notifications** (`/src/features/notifications/components/NotificationCenter.tsx`)
- ✅ Thêm safe area insets cho paddingTop
- ✅ Tăng `paddingBottom` lên 16px
- ✅ Thêm shadow và elevation cho header

### 6. **TabHeader Component** (`/src/components/TabHeader.tsx`)
- ✅ Tạo component header chung để tái sử dụng
- ✅ Consistent styling và spacing
- ✅ Logo + tabs trong một row
- ✅ Shadow và elevation chuẩn

## Kết quả:
- ✅ Tất cả header có khoảng cách đều đặn với nội dung
- ✅ Shadow và elevation nhất quán
- ✅ Visual hierarchy rõ ràng hơn
- ✅ UI mượt mà và professional hơn
- ✅ Consistent spacing across all tabs

## Cấu trúc Header chuẩn:
```typescript
headerContainer: {
  paddingTop: Platform.OS === 'ios' ? 56 : 46,
  paddingBottom: 20,
  marginBottom: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 3,
}
```