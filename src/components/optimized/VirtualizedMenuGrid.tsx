import React, { memo, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MemoizedMenuItem } from './MemoizedMenuItem';
import { useIntersectionObserver } from '../../utils/performance/optimization';

interface VirtualizedMenuGridProps {
  items: any[];
  onAddToCart: (item: any) => void;
  columnCount?: number;
  rowHeight?: number;
}

const Cell = memo(({ columnIndex, rowIndex, style, data }: any) => {
  const { items, columnCount, onAddToCart } = data;
  const index = rowIndex * columnCount + columnIndex;
  const item = items[index];

  if (!item) return null;

  return (
    <div style={{ ...style, padding: '8px' }}>
      <MemoizedMenuItem item={item} onAddToCart={onAddToCart} />
    </div>
  );
});

Cell.displayName = 'VirtualizedCell';

export const VirtualizedMenuGrid = memo<VirtualizedMenuGridProps>(({
  items,
  onAddToCart,
  columnCount = 3,
  rowHeight = 320
}) => {
  const rowCount = Math.ceil(items.length / columnCount);

  const itemData = useMemo(() => ({
    items,
    columnCount,
    onAddToCart
  }), [items, columnCount, onAddToCart]);

  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <Grid
            columnCount={columnCount}
            columnWidth={width / columnCount}
            height={height}
            rowCount={rowCount}
            rowHeight={rowHeight}
            width={width}
            itemData={itemData}
            overscanRowCount={2}
            overscanColumnCount={1}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedMenuGrid.displayName = 'VirtualizedMenuGrid';