const fs = require('fs');
const path = require('path');

// Directories to process
const directories = ['src'];

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Counter for removed console.logs
let totalRemoved = 0;
const filesProcessed = [];

// Regex patterns for console.log statements
const patterns = [
  // Basic console.log
  /console\s*\.\s*log\s*\([^)]*\)\s*;?/g,
  // Multi-line console.log
  /console\s*\.\s*log\s*\([^)]*\n[^)]*\)\s*;?/g,
  // Console.error, warn, info, debug
  /console\s*\.\s*(error|warn|info|debug)\s*\([^)]*\)\s*;?/g,
  // Multi-line variants
  /console\s*\.\s*(error|warn|info|debug)\s*\([^)]*\n[^)]*\)\s*;?/g
];

function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let removedCount = 0;

  // Remove console statements
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      removedCount += matches.length;
      content = content.replace(pattern, '');
    }
  });

  // Clean up extra empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (removedCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesProcessed.push({ file: filePath, count: removedCount });
    totalRemoved += removedCount;
    console.log(`✓ Removed ${removedCount} console statements from ${path.relative(process.cwd(), filePath)}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', 'build', 'dist', '.git'].includes(file)) {
        processDirectory(filePath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        removeConsoleLogs(filePath);
      }
    }
  });
}

console.log('🧹 Removing console.log statements from frontend code...\n');

// Process each directory
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    processDirectory(fullPath);
  }
});

console.log('\n📊 Summary:');
console.log(`Total console statements removed: ${totalRemoved}`);
console.log(`Files processed: ${filesProcessed.length}`);

if (filesProcessed.length > 0) {
  console.log('\n📁 Files modified:');
  filesProcessed.forEach(({ file, count }) => {
    console.log(`  - ${path.relative(process.cwd(), file)}: ${count} removed`);
  });
}

console.log('\n✅ Console.log cleanup complete!');