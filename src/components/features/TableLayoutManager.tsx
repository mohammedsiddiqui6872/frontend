import React, { useState, useCallback, memo } from 'react';
import { DndProvider } from 'react-dnd';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Square, Circle, Hexagon, Triangle, Users, Edit2, Save, X } from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { logger } from '../../utils/logger';

interface TablePosition {
  x: number;
  y: number;
}

interface Table {
  id: string;
  number: string;
  capacity: number;
  shape: 'square' | 'circle' | 'rectangle' | 'hexagon';
  position: TablePosition;
  rotation: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  section?: string;
}

interface TableLayoutManagerProps {
  tables: Table[];
  onSave: (tables: Table[]) => void;
  readOnly?: boolean;
}

const TableShape: React.FC<{ shape: Table['shape'] }> = ({ shape }) => {
  switch (shape) {
    case 'circle':
      return <Circle className="w-full h-full" />;
    case 'rectangle':
      return <Square className="w-full h-full" style={{ transform: 'scaleX(1.5)' }} />;
    case 'hexagon':
      return <Hexagon className="w-full h-full" />;
    default:
      return <Square className="w-full h-full" />;
  }
};

const DraggableTable: React.FC<{
  table: Table;
  onMove: (id: string, position: TablePosition) => void;
  isEditing: boolean;
}> = memo(({ table, onMove, isEditing }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'table',
    item: { id: table.id, ...table.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: isEditing
  });

  const getStatusColor = () => {
    switch (table.status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'reserved':
        return 'bg-yellow-500';
      case 'maintenance':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      ref={drag}
      className={`absolute flex flex-col items-center justify-center p-2 rounded-lg shadow-lg transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${getStatusColor()} ${isEditing ? 'cursor-move' : 'cursor-pointer'}`}
      style={{
        left: `${table.position.x}px`,
        top: `${table.position.y}px`,
        width: '80px',
        height: '80px',
        transform: `rotate(${table.rotation}deg)`
      }}
    >
      <TableShape shape={table.shape} />
      <span className="text-white font-bold mt-1">{table.number}</span>
      <div className="flex items-center text-white text-xs">
        <Users className="w-3 h-3 mr-1" />
        {table.capacity}
      </div>
    </div>
  );
});

DraggableTable.displayName = 'DraggableTable';

const DropZone: React.FC<{
  onDrop: (item: any, position: TablePosition) => void;
  children: React.ReactNode;
}> = ({ onDrop, children }) => {
  const [, drop] = useDrop({
    accept: 'table',
    drop: (item: any, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const position = {
          x: Math.round(item.x + delta.x),
          y: Math.round(item.y + delta.y)
        };
        onDrop(item, position);
      }
    }
  });

  return (
    <div ref={drop} className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      {children}
    </div>
  );
};

export const TableLayoutManager: React.FC<TableLayoutManagerProps> = memo(({
  tables: initialTables,
  onSave,
  readOnly = false
}) => {
  const { t } = useTranslation();
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleTableMove = useCallback((id: string, position: TablePosition) => {
    setTables(prev => prev.map(table => 
      table.id === id ? { ...table, position } : table
    ));
    logger.debug('TableLayoutManager', 'Table moved', { id, position });
  }, []);

  const handleTableUpdate = useCallback((id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(table => 
      table.id === id ? { ...table, ...updates } : table
    ));
  }, []);

  const handleSave = useCallback(() => {
    onSave(tables);
    setIsEditing(false);
    logger.info('TableLayoutManager', 'Table layout saved');
  }, [tables, onSave]);

  const handleCancel = useCallback(() => {
    setTables(initialTables);
    setIsEditing(false);
  }, [initialTables]);

  const backend = 'ontouchstart' in window ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={backend}>
      <div className="w-full h-full">
        {/* Toolbar */}
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('tableLayout.title')}</h3>
          {!readOnly && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600"
                  >
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg flex items-center gap-2 hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Layout Area */}
        <div className="relative bg-white border-2 border-gray-300 rounded-lg" style={{ height: '600px' }}>
          <DropZone onDrop={handleTableMove}>
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #ccc, #ccc 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #ccc, #ccc 1px, transparent 1px, transparent 20px)'
              }}
            />

            {/* Tables */}
            {tables.map(table => (
              <DraggableTable
                key={table.id}
                table={table}
                onMove={handleTableMove}
                isEditing={isEditing}
              />
            ))}

            {/* Sections/Areas */}
            <div className="absolute top-4 left-4 text-gray-500 text-sm">
              {t('tableLayout.mainDining')}
            </div>
            <div className="absolute top-4 right-4 text-gray-500 text-sm">
              {t('tableLayout.privateArea')}
            </div>
          </DropZone>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>{t('tableLayout.available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>{t('tableLayout.occupied')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>{t('tableLayout.reserved')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span>{t('tableLayout.maintenance')}</span>
          </div>
        </div>

        {/* Table Details Panel */}
        {selectedTable && isEditing && (
          <div className="absolute right-0 top-0 w-80 h-full bg-white shadow-lg p-4 overflow-y-auto">
            <h4 className="font-semibold mb-4">{t('tableLayout.tableDetails')}</h4>
            {/* Table edit form would go here */}
          </div>
        )}
      </div>
    </DndProvider>
  );
});

TableLayoutManager.displayName = 'TableLayoutManager';