const fs = require('fs');
const path = require('path');

// Files to clean console logs from
const filesToClean = [
  'app/(tabs)/discover/match.tsx',
  'src/features/super-likes/services/super-like.service.ts',
  'contexts/AuthContext.tsx',
  'src/features/auth/services/oauth-handler.service.ts'
];

function removeConsoleLogs(filePath) {
  try {
    const fullPath = path.join('.', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalLength = content.length;
    
    // Remove console.log statements
    content = content.replace(/\s*console\.log\([^;]*\);?\s*/g, '');
    
    // Remove console.error statements  
    content = content.replace(/\s*console\.error\([^;]*\);?\s*/g, '');
    
    // Remove console.warn statements
    content = content.replace(/\s*console\.warn\([^;]*\);?\s*/g, '');
    
    // Remove console.info statements
    content = content.replace(/\s*console\.info\([^;]*\);?\s*/g, '');
    
    // Remove console.debug statements
    content = content.replace(/\s*console\.debug\([^;]*\);?\s*/g, '');
    
    // Clean up extra empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    const newLength = content.length;
    const removed = originalLength - newLength;
    
    if (removed > 0) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath}: Removed ${removed} characters of console logs`);
      return true;
    } else {
      console.log(`➖ ${filePath}: No console logs found`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function cleanAllFiles() {
  console.log('🧹 Removing Console Logs');
  console.log('========================');
  console.log('');
  
  let totalCleaned = 0;
  let totalFiles = 0;
  
  filesToClean.forEach(filePath => {
    totalFiles++;
    if (removeConsoleLogs(filePath)) {
      totalCleaned++;
    }
  });
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Files processed: ${totalFiles}`);
  console.log(`   - Files cleaned: ${totalCleaned}`);
  console.log(`   - Files unchanged: ${totalFiles - totalCleaned}`);
  console.log('');
  
  if (totalCleaned > 0) {
    console.log('🎉 Console logs removed successfully!');
    console.log('');
    console.log('💡 Benefits:');
    console.log('   - Cleaner production code');
    console.log('   - Better performance');
    console.log('   - Reduced bundle size');
    console.log('   - No sensitive data in logs');
  } else {
    console.log('✨ All files are already clean!');
  }
}

// Also clean specific patterns that might be missed
function advancedClean(filePath) {
  try {
    const fullPath = path.join('.', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove multi-line console statements
    content = content.replace(/console\.[a-zA-Z]+\(\s*[^)]*\s*\);?/gs, '');
    
    // Remove console statements with template literals
    content = content.replace(/console\.[a-zA-Z]+\(`[^`]*`[^;]*\);?/g, '');
    
    // Remove console statements with complex parameters
    content = content.replace(/console\.[a-zA-Z]+\([^;]*{[^}]*}[^;]*\);?/g, '');
    
    // Clean up comments that reference console
    content = content.replace(/\/\/.*console.*/g, '');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
    
  } catch (error) {
    return false;
  }
}

// Run the cleaning
cleanAllFiles();

// Advanced clean for match.tsx specifically
console.log('🔧 Advanced cleaning for match.tsx...');
if (advancedClean('app/(tabs)/discover/match.tsx')) {
  console.log('✅ Advanced cleaning completed');
} else {
  console.log('⚠️ Advanced cleaning skipped');
}