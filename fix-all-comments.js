const fs = require('fs');

function fixCommentsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix comments that are stuck to code
    content = content.replace(/}\/\//g, '}\n      //');
    content = content.replace(/;\/\//g, ';\n      //');
    content = content.replace(/\) {\/\//g, ') {\n        //');
    content = content.replace(/catch \([^)]*\) {\/\//g, (match) => {
      return match.replace('{//', '{\n        //');
    });
    content = content.replace(/try {\/\//g, 'try {\n      //');
    content = content.replace(/} catch/g, '}\n    } catch');
    content = content.replace(/throw error;}/g, 'throw error;\n      }');
    
    // Fix specific patterns found in the search
    content = content.replace(/} catch \(socialError\) {\/\/ Don't throw/g, '} catch (socialError) {\n        // Don\'t throw');
    content = content.replace(/} catch \(error\) {setProfile/g, '} catch (error) {\n      setProfile');
    content = content.replace(/} catch \(trackError\) {\/\/ track IP/g, '} catch (trackError) {\n        // track IP');
    content = content.replace(/try {\/\/ Clear local state first/g, 'try {\n      // Clear local state first');
    content = content.replace(/AuthRetryableFetchError'\)\) {\/\/ Don't throw error/g, 'AuthRetryableFetchError\')) {\n          // Don\'t throw error');
    content = content.replace(/if \(!user\) throw new Error\('No user found'\);\/\/ Kiểm tra/g, 'if (!user) throw new Error(\'No user found\');\n\n    // Kiểm tra');
    content = content.replace(/throw error;\/\//g, 'throw error;\n      //');
    content = content.replace(/}\/\/ Nếu là seller/g, '}\n\n    // Nếu là seller');
    content = content.replace(/});} catch \(subscriptionError\) {\/\/ Không throw error/g, '});\n      } catch (subscriptionError) {\n        // Không throw error');
    content = content.replace(/await refreshProfile\(\);\/\/ Return role/g, 'await refreshProfile();\n    \n    // Return role');
    
    // Clean up extra spaces and normalize indentation
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/^\s*\/\//gm, (match) => {
      const spaces = match.match(/^\s*/)[0];
      return spaces + '//';
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed comments in ${filePath}`);
      return true;
    } else {
      console.log(`➖ No comment issues found in ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing All Comment Syntax Issues');
console.log('===================================');
console.log('');

const filesToFix = [
  './contexts/AuthContext.tsx',
  './app/(tabs)/discover/match.tsx',
  './src/features/super-likes/services/super-like.service.ts',
  './src/features/auth/services/oauth-handler.service.ts'
];

let fixedCount = 0;

filesToFix.forEach(file => {
  if (fixCommentsInFile(file)) {
    fixedCount++;
  }
});

console.log('');
console.log('📊 Summary:');
console.log(`   - Files processed: ${filesToFix.length}`);
console.log(`   - Files fixed: ${fixedCount}`);
console.log(`   - Files unchanged: ${filesToFix.length - fixedCount}`);

console.log('');
console.log('🎯 Fixed Issues:');
console.log('   - Comments stuck to closing braces }//');
console.log('   - Comments stuck to semicolons ;//');
console.log('   - Comments stuck to catch blocks catch() {//');
console.log('   - Comments stuck to try blocks try {//');
console.log('   - Missing newlines between code and comments');

console.log('');
console.log('🚀 Ready to build:');
console.log('   npx expo run:android');

console.log('');
console.log('💡 If still getting errors:');
console.log('   1. Clear Metro cache: npx expo start --clear');
console.log('   2. Restart development server');
console.log('   3. Check for any remaining syntax issues');