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
  
  // Fix logger calls missing component name
  // Pattern: logger.method('message', data) -> logger.method('Component', 'message', data)
  const patterns = [
    {
      // logger.error('message', error)
      regex: /logger\.(error|warn|info|debug)\('([^']+)',\s*(\w+)\)/g,
      replacement: (match, method, message, errorVar) => {
        const componentName = getComponentName(file);
        return `logger.${method}('${componentName}', '${message}', ${errorVar})`;
      }
    },
    {
      // logger.info('message')
      regex: /logger\.(error|warn|info|debug)\('([^']+)'\)/g,
      replacement: (match, method, message) => {
        const componentName = getComponentName(file);
        return `logger.${method}('${componentName}', '${message}')`;
      }
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
  const name = basename.replace(/\.(test|spec|stories)$/, '');
  // Convert kebab-case to PascalCase
  return name.split(/[-.]/).map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

console.log(`\nFixed logger calls in ${totalFixed} files`);