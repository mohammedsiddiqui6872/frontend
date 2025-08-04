const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', { 
  cwd: path.join(__dirname, '..'),
  absolute: true 
});

let totalFixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  const componentName = getComponentName(file);
  
  // Fix all logger patterns
  const patterns = [
    // Pattern 1: logger.method('message', { data })
    {
      regex: /logger\.(error|warn|info|debug)\((['"`])([^'"`]+)\2,\s*(\{[^}]+\})\)/g,
      replacement: `logger.$1('${componentName}', $2$3$2, $4)`
    },
    // Pattern 2: logger.method('message', variable)
    {
      regex: /logger\.(error|warn|info|debug)\((['"`])([^'"`]+)\2,\s*([a-zA-Z_]\w*)\)/g,
      replacement: `logger.$1('${componentName}', $2$3$2, $4)`
    },
    // Pattern 3: logger.method('message')
    {
      regex: /logger\.(error|warn|info|debug)\((['"`])([^'"`]+)\2\)/g,
      replacement: `logger.$1('${componentName}', $2$3$2)`
    },
    // Pattern 4: logger.method(`message ${var}`, data)
    {
      regex: /logger\.(error|warn|info|debug)\((`[^`]+`),\s*([^)]+)\)/g,
      replacement: `logger.$1('${componentName}', $2, $3)`
    },
    // Pattern 5: logger.method(`message ${var}`)
    {
      regex: /logger\.(error|warn|info|debug)\((`[^`]+`)\)/g,
      replacement: `logger.$1('${componentName}', $2)`
    }
  ];
  
  patterns.forEach(({ regex, replacement }) => {
    const newContent = content.replace(regex, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(file, content);
    totalFixed++;
    console.log(`✓ Fixed logger calls in ${path.basename(file)}`);
  }
});

function getComponentName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  // Remove .test, .spec, .stories etc
  const name = basename.replace(/\.(test|spec|stories|service|multi-tenant)$/, '');
  // Convert kebab-case to PascalCase
  return name.split(/[-.]/).map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

console.log(`\nFixed logger calls in ${totalFixed} files`);