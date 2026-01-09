# PayOS Debug Guide

## Vấn đề hiện tại
- Lỗi "Edge Function returned a non-2xx status code" khi sử dụng PayOS trong products
- Chat transactions hoạt động bình thường

## Nguyên nhân có thể
1. **PayOS Credentials chưa được set** trong Supabase Secrets
2. **Format request không đúng** theo PayOS API
3. **Signature không đúng** (PayOS yêu cầu signature)

## Cách debug

### 1. Kiểm tra trong App
1. Mở app → **Me tab** → **Notifications** → **PayOS Debug**
2. Nhấn **"Test Products PayOS"** để test format products
3. Nhấn **"Chạy test PayOS"** để test tất cả
4. Xem console logs để biết lỗi chi tiết

### 2. Kiểm tra PayOS Credentials
PayOS credentials phải được set trong Supabase Secrets:

```bash
# Cần chạy các lệnh này trong Supabase CLI
supabase secrets set PAYOS_CLIENT_ID=your_client_id
supabase secrets set PAYOS_API_KEY=your_api_key  
supabase secrets set PAYOS_CHECKSUM_KEY=your_checksum_key
```

**Lấy credentials từ:** https://my.payos.vn/

### 3. Test bằng Script (nếu có Node.js)
```bash
cd Pedopt
node test-payos-simple.js
```

## Những gì đã sửa

### 1. Edge Function (`create-payos-payment-link`)
- ✅ Thêm signature generation theo PayOS Node.js library
- ✅ Validate orderCode và amount
- ✅ Handle cả 2 format: products và chat transactions
- ✅ Proper error handling và response format
- ✅ Thêm required headers: `x-partner-code`, `x-request-id`

### 2. PayOSService
- ✅ Thêm validation request trước khi gửi
- ✅ Ensure returnUrl/cancelUrl được set
- ✅ Better error handling

### 3. Debug Tools
- ✅ PayOSDebugPanel component để test trong app
- ✅ PayOSDebug utility với các test functions
- ✅ Test script để chạy ngoài app

## Các lỗi thường gặp

### 1. "PayOS configuration missing"
**Nguyên nhân:** Chưa set PayOS credentials trong Supabase Secrets
**Giải pháp:** Set credentials bằng Supabase CLI

### 2. "Invalid orderCode"
**Nguyên nhân:** orderCode không phải số hoặc <= 0
**Giải pháp:** Đảm bảo orderCode là số dương

### 3. "Missing required fields"
**Nguyên nhân:** Thiếu orderCode, amount, hoặc items
**Giải pháp:** Kiểm tra request format

### 4. "PayOS API Error"
**Nguyên nhân:** PayOS API trả về lỗi (credentials sai, signature sai, etc.)
**Giải pháp:** Kiểm tra credentials và format request

## Format Request đúng

### Products Format:
```typescript
{
  orderCode: number,        // Required: Mã đơn hàng (số dương)
  amount: number,          // Required: Số tiền (VND, số nguyên)
  description: string,     // Required: Mô tả
  items: [{               // Required: Danh sách sản phẩm
    name: string,
    quantity: number,
    price: number
  }],
  buyerName?: string,     // Optional: Tên người mua
  buyerEmail?: string,    // Optional: Email
  buyerPhone?: string,    // Optional: SĐT
  buyerAddress?: string,  // Optional: Địa chỉ
  returnUrl?: string,     // Optional: URL success
  cancelUrl?: string      // Optional: URL cancel
}
```

### Chat Transactions Format:
```typescript
{
  transaction_id: string,  // Required: ID giao dịch
  amount: number,         // Required: Số tiền
  pet_name: string,       // Required: Tên thú cưng
  transaction_code: string, // Required: Mã giao dịch
  return_url?: string,    // Optional: URL success
  cancel_url?: string     // Optional: URL cancel
}
```

## Kiểm tra logs

### 1. Supabase Edge Function Logs
1. Vào https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/functions
2. Chọn `create-payos-payment-link`
3. Xem logs để biết lỗi chi tiết

### 2. App Console Logs
Mở Developer Tools trong app và xem console để thấy:
- 🔄 Creating PayOS payment with request
- 📡 Sending request to Edge Function
- 📡 Edge Function response
- ❌ Các lỗi chi tiết

## Liên hệ hỗ trợ
Nếu vẫn gặp lỗi, cung cấp:
1. Console logs từ app
2. Edge Function logs từ Supabase
3. PayOS credentials status (có set chưa)
4. Request data đang gửi