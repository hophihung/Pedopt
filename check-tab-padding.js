const fs = require('fs');
const path = require('path');

// Danh sách các file cần kiểm tra
const filesToCheck = [
  'app/(tabs)/discover/explore.tsx',
  'app/(tabs)/discover/match.tsx', 
  'app/(tabs)/discover/reel.tsx',
  'app/(tabs)/social/chat.tsx',
  'app/(tabs)/me/profile.tsx',
  'app/(tabs)/me/settings.tsx',
  'app/(tabs)/me/dashboard.tsx',
  'app/(tabs)/me/notifications.tsx',
  'app/(tabs)/me/edit-profile.tsx',
  'app/(tabs)/me/rewards.tsx',
  'src/features/notifications/components/NotificationCenter.tsx',
];

console.log('🔍 Kiểm tra Tab Layout Padding');
console.log('===============================');
console.log('');

function checkFile(filePath) {
  try {
    const fullPath = path.join('.', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Kiểm tra các pattern padding
    const hasScrollView = content.includes('ScrollView');
    const hasFlatList = content.includes('FlatList');
    const hasContentContainerStyle = content.includes('contentContainerStyle');
    const hasPaddingBottom = content.includes('paddingBottom');
    const hasInsetsBottom = content.includes('insets.bottom');
    const hasUseSafeAreaInsets = content.includes('useSafeAreaInsets');
    
    let status = '✅';
    let issues = [];
    
    if (hasScrollView || hasFlatList) {
      if (!hasContentContainerStyle) {
        status = '⚠️';
        issues.push('Thiếu contentContainerStyle');
      }
      
      if (!hasPaddingBottom) {
        status = '❌';
        issues.push('Thiếu paddingBottom');
      }
      
      if (!hasInsetsBottom && !content.includes('paddingBottom: 100')) {
        status = '⚠️';
        issues.push('Nên sử dụng insets.bottom hoặc padding cố định');
      }
      
      if (hasInsetsBottom && !hasUseSafeAreaInsets) {
        status = '❌';
        issues.push('Sử dụng insets.bottom nhưng thiếu import useSafeAreaInsets');
      }
    } else {
      status = '➖';
      issues.push('Không có ScrollView/FlatList');
    }
    
    return { status, issues, hasScrollView, hasFlatList };
  } catch (error) {
    return { status: '❌', issues: [`Lỗi đọc file: ${error.message}`], hasScrollView: false, hasFlatList: false };
  }
}

console.log('📱 Kết quả kiểm tra:');
console.log('');

let totalFiles = 0;
let okFiles = 0;
let warningFiles = 0;
let errorFiles = 0;

filesToCheck.forEach(filePath => {
  const result = checkFile(filePath);
  totalFiles++;
  
  if (result.status === '✅') okFiles++;
  else if (result.status === '⚠️') warningFiles++;
  else if (result.status === '❌') errorFiles++;
  
  console.log(`${result.status} ${filePath}`);
  
  if (result.issues.length > 0) {
    result.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }
  
  if (result.hasScrollView || result.hasFlatList) {
    console.log(`   - Có ${result.hasScrollView ? 'ScrollView' : ''}${result.hasScrollView && result.hasFlatList ? ' và ' : ''}${result.hasFlatList ? 'FlatList' : ''}`);
  }
  
  console.log('');
});

console.log('📊 Tổng kết:');
console.log(`   - Tổng số file: ${totalFiles}`);
console.log(`   - ✅ OK: ${okFiles}`);
console.log(`   - ⚠️ Cảnh báo: ${warningFiles}`);
console.log(`   - ❌ Lỗi: ${errorFiles}`);
console.log('');

if (errorFiles > 0) {
  console.log('🔧 Cần sửa:');
  console.log('1. Thêm useSafeAreaInsets import');
  console.log('2. Thêm contentContainerStyle với paddingBottom');
  console.log('3. Sử dụng insets.bottom + 80-100 cho padding');
  console.log('');
}

console.log('💡 Mẹo:');
console.log('- Sử dụng: paddingBottom: insets.bottom + 100');
console.log('- Hoặc: paddingBottom: 100 (nếu không dùng insets)');
console.log('- Đảm bảo import useSafeAreaInsets từ react-native-safe-area-context');
console.log('');

if (okFiles === totalFiles) {
  console.log('🎉 Tất cả các trang đã có padding đúng!');
} else {
  console.log(`⚠️ Còn ${totalFiles - okFiles} trang cần kiểm tra/sửa.`);
}