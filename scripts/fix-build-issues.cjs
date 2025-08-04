const fs = require('fs');
const path = require('path');

// Fix MenuPage categories
const menuPagePath = path.join(__dirname, '..', 'src/pages/MenuPage.tsx');
if (fs.existsSync(menuPagePath)) {
  let content = fs.readFileSync(menuPagePath, 'utf8');
  
  // Replace categories with proper icons
  content = content.replace(
    /const categories = useMemo\(\(\) => \[\s*\n\s*{ id: 'appetizers', name: 'Appetizers', icon: null },\s*\n\s*{ id: 'main-courses', name: 'Main Courses', icon: null },\s*\n\s*{ id: 'desserts', name: 'Desserts', icon: null },\s*\n\s*{ id: 'beverages', name: 'Beverages', icon: null }\s*\n\s*\], \[\]\);/,
    `const categories = useMemo(() => {
    // Default icon components
    const DefaultIcon = () => <span>📋</span>;
    
    return [
      { id: 'all', name: 'All Items', icon: DefaultIcon },
      { id: 'appetizers', name: 'Appetizers', icon: DefaultIcon },
      { id: 'main-courses', name: 'Main Courses', icon: DefaultIcon },
      { id: 'desserts', name: 'Desserts', icon: DefaultIcon },
      { id: 'beverages', name: 'Beverages', icon: DefaultIcon }
    ];
  }, []);`
  );
  
  fs.writeFileSync(menuPagePath, content);
  console.log('✓ Fixed MenuPage categories');
}

console.log('\nAll build issues fixed!');