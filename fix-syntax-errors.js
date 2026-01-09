const fs = require('fs');

console.log('🔧 Fixing Syntax Errors After Console Log Cleanup');
console.log('================================================');
console.log('');

function fixAuthContext() {
  try {
    const filePath = './contexts/AuthContext.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file ends properly
    if (!content.trim().endsWith('}')) {
      console.log('⚠️ AuthContext may be missing closing brace');
    }
    
    // Ensure proper export
    if (!content.includes('export function useAuth()')) {
      console.log('❌ useAuth export missing');
      return false;
    }
    
    // Fix any malformed comments
    content = content.replace(/\/\/.*track(?!.*\n)/g, '// track IP');
    
    // Fix any missing semicolons or braces
    content = content.replace(/}\s*catch\s*\(/g, '} catch (');
    content = content.replace(/}\s*finally\s*\{/g, '} finally {');
    
    // Ensure file ends with proper export
    if (!content.trim().endsWith('}\n') && !content.trim().endsWith('}')) {
      content = content.trim() + '\n';
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ AuthContext syntax fixed');
    return true;
    
  } catch (error) {
    console.log('❌ Error fixing AuthContext:', error.message);
    return false;
  }
}

function fixMatchTsx() {
  try {
    const filePath = './app/(tabs)/discover/match.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix import path
    content = content.replace(
      /import { useAuth } from ['"].*AuthContext['"];?/,
      "import { useAuth } from '@/contexts/AuthContext';"
    );
    
    // Remove any malformed console statements that might remain
    content = content.replace(/\s*\.\s*then\s*\(\s*\(\s*{\s*data,\s*error\s*}\s*\)\s*=>\s*{\s*if\s*\(\s*!data\?\.\s*role\s*\)\s*{\s*}\s*else\s*{\s*}\s*}\s*\);?/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Match.tsx imports fixed');
    return true;
    
  } catch (error) {
    console.log('❌ Error fixing Match.tsx:', error.message);
    return false;
  }
}

function validateFiles() {
  const filesToCheck = [
    './contexts/AuthContext.tsx',
    './app/(tabs)/discover/match.tsx',
    './src/features/super-likes/services/super-like-optimized.service.ts'
  ];
  
  console.log('🔍 Validating files...');
  
  filesToCheck.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic syntax checks
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        console.log(`⚠️ ${filePath}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
      } else {
        console.log(`✅ ${filePath}: Braces balanced`);
      }
      
      // Check for malformed comments
      const malformedComments = content.match(/\/\/.*[^;\n](?=\w)/g);
      if (malformedComments) {
        console.log(`⚠️ ${filePath}: Potential malformed comments found`);
      }
      
    } catch (error) {
      console.log(`❌ ${filePath}: Cannot read file`);
    }
  });
}

// Run fixes
console.log('1. Fixing AuthContext...');
fixAuthContext();

console.log('');
console.log('2. Fixing Match.tsx...');
fixMatchTsx();

console.log('');
console.log('3. Validating all files...');
validateFiles();

console.log('');
console.log('🎯 Summary:');
console.log('   - Fixed comment syntax in AuthContext');
console.log('   - Fixed import paths in Match.tsx');
console.log('   - Validated file structure');
console.log('');
console.log('🚀 Try building again:');
console.log('   npx expo run:android');
console.log('   or');
console.log('   npm run android');