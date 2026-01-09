# Network Status Setup

## Cài đặt package

Chạy lệnh sau để cài đặt package cần thiết:

```bash
npm install @react-native-community/netinfo
```

hoặc

```bash
yarn add @react-native-community/netinfo
```

## Sử dụng

### 1. Banner tự động (đã tích hợp sẵn)

Banner sẽ tự động hiển thị ở top màn hình khi mất kết nối internet. Đã được thêm vào `app/_layout.tsx`.

### 2. Màn hình No Internet riêng

Để hiển thị màn hình no internet:

```typescript
import { NoInternetScreen } from '@/src/components';

// Trong component
<NoInternetScreen onRetry={() => {
  // Xử lý khi user nhấn retry
}} />
```

### 3. Hook để check network status

```typescript
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';

function MyComponent() {
  const { isConnected, isOffline } = useNetworkStatus();
  
  if (isOffline) {
    return <NoInternetScreen />;
  }
  
  return <YourContent />;
}
```

## Components đã tạo

1. **NoInternetScreen** - Màn hình full screen đẹp với animation
2. **NoInternetBanner** - Banner nhỏ ở top màn hình
3. **useNetworkStatus** - Hook để detect internet connection

## Features

- ✅ Animation mượt mà khi hiển thị/ẩn
- ✅ Icon và màu sắc đẹp mắt
- ✅ Bo góc tròn, shadow đẹp
- ✅ Gợi ý cách khắc phục
- ✅ Nút retry với icon
- ✅ Tự động detect khi có internet trở lại
- ✅ Có thể dismiss banner
- ✅ Responsive và thân thiện với người dùng lowtech

## Test

Để test, bạn có thể:
1. Tắt WiFi/Data trên thiết bị
2. Hoặc navigate đến `/no-internet` để xem màn hình demo
