
interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  image?: string; // Add this field
}

interface CategorySidebarProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <aside className="w-20 md:w-28 bg-white shadow-lg flex-shrink-0">
      <nav className="flex flex-col p-1 md:p-2 gap-1 md:gap-2">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-xl 
                        transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'hover:bg-gray-100'
              }`}
            >
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-lg mb-1"
                  onError={(e) => {
                    // Hide image and show icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    const iconElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (iconElement) {
                      iconElement.style.display = 'block';
                    }
                  }}
                />
              ) : null}
              <Icon 
                size={20} 
                className="mb-1"
                style={{ display: category.image ? 'none' : 'block' }}
              />
              <span className="text-[10px] md:text-xs font-medium text-center leading-tight">{category.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};