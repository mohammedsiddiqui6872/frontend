import { useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MenuItem as MenuItemComponent } from './MenuItem';
import { MenuItem } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';

interface VirtualizedMenuGridProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  t: any;
}

const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;
const GAP = 16;

export const VirtualizedMenuGrid = ({
  items,
  onAddToCart,
  t,
}: VirtualizedMenuGridProps) => {
  const { favorites, toggleFavorite } = useUIStore();

  // Memoize column count calculation
  const getColumnCount = useCallback((width: number) => {
    return Math.max(1, Math.floor(width / (CARD_WIDTH + GAP)));
  }, []);

  // Cell renderer
  const Cell = useCallback(({ columnIndex, rowIndex, style, data }: GridChildComponentProps) => {
    const { items, columnCount, onAddToCart, t, favorites, toggleFavorite } = data;
    const index = rowIndex * columnCount + columnIndex;
    
    if (index >= items.length) {
      return null;
    }

    const item = items[index];
    const adjustedStyle = {
      ...style,
      left: (style.left as number) + GAP / 2,
      top: (style.top as number) + GAP / 2,
      width: (style.width as number) - GAP,
      height: (style.height as number) - GAP,
    };

    return (
      <div style={adjustedStyle}>
        <MenuItemComponent
          item={item}
          isFavorite={favorites.includes(item.id)}
          onToggleFavorite={() => toggleFavorite(item.id)}
          onAddToCart={() => onAddToCart(item)}
          t={t}
        />
      </div>
    );
  }, []);

  return (
    <div className="flex-1 w-full h-full min-h-[600px]">
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
          const columnCount = getColumnCount(width);
          const rowCount = Math.ceil(items.length / columnCount);

          return (
            <Grid
              className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
              columnCount={columnCount}
              columnWidth={CARD_WIDTH + GAP}
              height={height}
              rowCount={rowCount}
              rowHeight={CARD_HEIGHT + GAP}
              width={width}
              itemData={{
                items,
                columnCount,
                onAddToCart,
                t,
                favorites,
                toggleFavorite,
              }}
            >
              {Cell}
            </Grid>
          );
        }}
      </AutoSizer>
    </div>
  );
};

// Wrapper component for progressive enhancement
export const MenuGridWrapper = ({
  items,
  onAddToCart,
  t,
  searchQuery,
}: VirtualizedMenuGridProps & { searchQuery: string }) => {
  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Use virtualization only for large lists
  const useVirtualization = filteredItems.length > 20;

  if (useVirtualization) {
    return (
      <VirtualizedMenuGrid
        items={filteredItems}
        onAddToCart={onAddToCart}
        t={t}
      />
    );
  }

  // Fallback to regular grid for small lists
  const { favorites, toggleFavorite } = useUIStore();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {filteredItems.map(item => (
        <MenuItemComponent
          key={item.id}
          item={item}
          isFavorite={favorites.includes(item.id)}
          onToggleFavorite={() => toggleFavorite(item.id)}
          onAddToCart={() => onAddToCart(item)}
          t={t}
        />
      ))}
    </div>
  );
};