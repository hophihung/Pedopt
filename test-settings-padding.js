const fs = require('fs');

console.log('🔍 Kiểm tra Settings Page Padding');
console.log('==================================');
console.log('');

try {
  const content = fs.readFileSync('./app/(tabs)/me/settings.tsx', 'utf8');
  
  // Kiểm tra các yếu tố quan trọng
  const hasFacebookConnection = content.includes('FacebookConnection');
  const hasUseSafeAreaInsets = content.includes('useSafeAreaInsets');
  const hasPaddingBottom = content.includes('paddingBottom: insets.bottom');
  const paddingValue = content.match(/paddingBottom: insets\.bottom \+ (\d+)/);
  const hasSaveButtonMargin = content.includes('marginBottom: 20');
  
  console.log('📱 Kết quả kiểm tra Settings:');
  console.log('');
  
  // Facebook Connection
  if (hasFacebookConnection) {
    console.log('❌ Vẫn còn FacebookConnection component');
  } else {
    console.log('✅ Đã xóa FacebookConnection component');
  }
  
  // Safe Area Insets
  if (hasUseSafeAreaInsets) {
    console.log('✅ Đã import useSafeAreaInsets');
  } else {
    console.log('❌ Thiếu useSafeAreaInsets import');
  }
  
  // Padding Bottom
  if (hasPaddingBottom && paddingValue) {
    const padding = parseInt(paddingValue[1]);
    console.log(`✅ Có paddingBottom: insets.bottom + ${padding}`);
    
    if (padding >= 120) {
      console.log('✅ Padding đủ lớn để tránh bị che khuất');
    } else {
      console.log('⚠️ Padding có thể chưa đủ (nên >= 120)');
    }
  } else {
    console.log('❌ Thiếu paddingBottom với insets.bottom');
  }
  
  // Save Button Margin
  if (hasSaveButtonMargin) {
    console.log('✅ Save button có margin bottom');
  } else {
    console.log('⚠️ Save button chưa có margin bottom');
  }
  
  console.log('');
  
  // Tổng kết
  const issues = [];
  if (hasFacebookConnection) issues.push('Xóa FacebookConnection');
  if (!hasUseSafeAreaInsets) issues.push('Thêm useSafeAreaInsets');
  if (!hasPaddingBottom) issues.push('Thêm paddingBottom');
  if (paddingValue && parseInt(paddingValue[1]) < 120) issues.push('Tăng padding value');
  if (!hasSaveButtonMargin) issues.push('Thêm margin cho save button');
  
  if (issues.length === 0) {
    console.log('🎉 Settings page đã được cấu hình hoàn hảo!');
    console.log('   - Không bị tab layout che khuất');
    console.log('   - Đã xóa Facebook login section');
    console.log('   - Có đủ khoảng cách ở cuối trang');
  } else {
    console.log('🔧 Cần sửa:');
    issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }
  
  console.log('');
  console.log('💡 Lưu ý:');
  console.log('- Padding bottom = insets.bottom + 120 để tránh tab layout');
  console.log('- Save button có margin bottom để tạo khoảng cách');
  console.log('- Đã xóa Facebook Connection để đơn giản hóa UI');
  
} catch (error) {
  console.log('❌ Lỗi đọc file:', error.message);
}