# Debug PayOS Step by Step

## 🚨 Vấn đề hiện tại
- **Chat PayOS**: ✅ Hoạt động bình thường
- **Products PayOS**: ❌ Lỗi "Edge Function returned a non-2xx status code"

## 🔍 Nguyên nhân có thể

### 1. Edge Function chưa được deploy với code mới
- Code đã được sửa nhưng chưa deploy lên Supabase
- Edge Function đang crash do lỗi runtime

### 2. Sự khác biệt giữa Chat và Products format
- Chat: `transaction_id`, `pet_name`, `transaction_code`
- Products: `orderCode`, `amount`, `description`, `items`

### 3. PayOS credentials hoặc API call khác nhau

## 🧪 Cách debug từng bước

### Bước 1: Test Direct Edge Function
1. Mở app → **Me** → **Notifications** → **PayOS Debug**
2. Nhấn **"Test Direct Edge Function"**
3. Xem kết quả:
   - ✅ **Success**: Edge Function hoạt động → Vấn đề ở PayOSService
   - ❌ **Failed**: Edge Function có lỗi → Cần fix Edge Function

### Bước 2: So sánh Chat vs Products
1. Nhấn **"Test Products PayOS"** → Xem có lỗi không
2. Test chat trong app thực tế → Xem có hoạt động không
3. So sánh console logs để thấy sự khác biệt

### Bước 3: Kiểm tra Supabase Logs
1. Vào https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/functions
2. Chọn `create-payos-payment-link`
3. Xem logs khi test để thấy lỗi chi tiết

## 🔧 Các fix có thể

### Fix 1: Nếu Edge Function chưa deploy
```bash
# Cần deploy Edge Function với code mới
supabase functions deploy create-payos-payment-link
```

### Fix 2: Nếu Edge Function có lỗi runtime
- Kiểm tra logs trong Supabase Dashboard
- Sửa lỗi trong code và deploy lại

### Fix 3: Nếu format request khác nhau
- Đảm bảo Edge Function handle cả 2 format đúng
- Kiểm tra logic detect format: `isTransactionFormat = requestBody.transaction_id && !requestBody.orderCode`

### Fix 4: Nếu PayOS API call khác nhau
- Đảm bảo cả chat và products đều gọi PayOS API giống nhau
- Kiểm tra headers và request body

## 📋 Checklist debug

- [ ] **Test Direct Edge Function** → Xem Edge Function có hoạt động không
- [ ] **Kiểm tra Supabase Logs** → Xem lỗi chi tiết
- [ ] **So sánh request format** → Chat vs Products
- [ ] **Kiểm tra PayOS credentials** → Có đúng không
- [ ] **Test trong chat thực tế** → Xem chat có hoạt động không

## 🎯 Kết quả mong đợi

Sau khi debug, chúng ta sẽ biết:
1. **Edge Function có hoạt động không?**
2. **Lỗi cụ thể là gì?**
3. **Sự khác biệt giữa chat và products?**
4. **Cách fix phù hợp?**

## 📞 Nếu vẫn không fix được

Cung cấp thông tin sau:
1. **Kết quả test Direct Edge Function**
2. **Supabase Function Logs**
3. **Console logs từ app**
4. **Request data đang gửi**

---

**Bắt đầu với Bước 1: Test Direct Edge Function ngay bây giờ!**