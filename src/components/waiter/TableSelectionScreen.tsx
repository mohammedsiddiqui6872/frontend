import React, { useState, useEffect } from 'react';
import { Grid, Users, Clock, DollarSign, Loader, RefreshCw, LogOut, AlertCircle, UserMinus, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/api.service';
import { TableHandoverModal } from './TableHandoverModal';

interface TableState {
  tableNumber: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  currentWaiter?: {
    _id: string;
    name: string;
    email: string;
  };
  activeCustomerSession?: {
    _id: string;
    customerName: string;
    occupancy: number;
    startTime: string;
  };
  activeOrders: any[];
  waiterSessionInfo?: {
    loginTime: string;
    lastActivity: string;
    duration: number;
  };
}

interface TableSelectionScreenProps {
  onTableSelected: (tableNumber: string) => void;
  t: any;
}

export const TableSelectionScreen: React.FC<TableSelectionScreenProps> = ({ onTableSelected, t }) => {
  const { authToken, logout, setAssignedTables } = useAuthStore();
  const [tables, setTables] = useState<TableState[]>([]);
  const [myTables, setMyTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [handoverModal, setHandoverModal] = useState<{ isOpen: boolean; tableNumber: string; waiterName?: string }>({
    isOpen: false,
    tableNumber: '',
    waiterName: undefined
  });

  const fetchTables = async () => {
    try {
      setError(null);
      
      // Fetch all table states
      const tablesResponse = await apiService.fetchWithAuth('/tables/state', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!tablesResponse.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      const tablesData = await tablesResponse.json();
      setTables(tablesData);
      
      // Fetch waiter's assigned tables
      const myTablesResponse = await apiService.fetchWithAuth('/auth/my-tables', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (myTablesResponse.ok) {
        const myTablesData = await myTablesResponse.json();
        const assignedTableNumbers = myTablesData.tables?.map((t: any) => t.tableNumber) || [];
        setMyTables(assignedTableNumbers);
        setAssignedTables(assignedTableNumbers);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchTables, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [authToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const handleTableSelect = async (tableNumber: string) => {
    const table = tables.find(t => t.tableNumber === tableNumber);
    
    // Check if table is already occupied by another waiter
    if (table?.currentWaiter && !myTables.includes(tableNumber)) {
      const confirm = window.confirm(
        `This table is currently assigned to ${table.currentWaiter.name}. Do you want to request access?`
      );
      
      if (confirm) {
        try {
          const response = await apiService.fetchWithAuth('/auth/request-table', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              tableNumber,
              reason: 'Assisting with service'
            })
          });
          
          if (response.ok) {
            await fetchTables(); // Refresh the table list
          }
        } catch (err) {
          console.error('Error requesting table access:', err);
        }
      }
      return;
    }
    
    // If table is not assigned to anyone, assign it to current waiter
    if (!table?.currentWaiter) {
      try {
        const response = await apiService.fetchWithAuth(`/tables/${tableNumber}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            waiterId: useAuthStore.getState().employeeId
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to assign table');
        }
      } catch (err) {
        console.error('Error assigning table:', err);
        return;
      }
    }
    
    // Select the table
    onTableSelected(tableNumber);
  };

  const handleHandoverTable = (tableNumber: string, waiterName?: string) => {
    setHandoverModal({
      isOpen: true,
      tableNumber,
      waiterName
    });
  };

  const handleReleaseTable = async (tableNumber: string) => {
    if (!window.confirm(`Are you sure you want to release table ${tableNumber}?`)) {
      return;
    }

    try {
      const response = await apiService.fetchWithAuth(`/tables/${tableNumber}/release`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to release table');
      }

      await fetchTables(); // Refresh the table list
    } catch (err) {
      console.error('Error releasing table:', err);
      alert(err instanceof Error ? err.message : 'Failed to release table');
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cleaning':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Grid className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Table Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">My Assigned Tables</h2>
          <div className="flex flex-wrap gap-2">
            {myTables.length === 0 ? (
              <p className="text-gray-500">No tables assigned yet</p>
            ) : (
              myTables.map(tableNum => (
                <span
                  key={tableNum}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  Table {tableNum}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => {
            const isMyTable = myTables.includes(table.tableNumber);
            const isOccupied = table.status === 'occupied';
            const hasActiveOrders = table.activeOrders.length > 0;
            
            return (
              <div
                key={table.tableNumber}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200 
                  ${isMyTable ? 'border-purple-500 shadow-lg' : 'border-gray-200'}
                  ${getTableStatusColor(table.status)}
                  hover:shadow-md
                `}
              >
                {isMyTable && (
                  <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    My Table
                  </div>
                )}
                
                <div 
                  className="cursor-pointer"
                  onClick={() => handleTableSelect(table.tableNumber)}
                >
                  <div className="text-2xl font-bold mb-2">
                    Table {table.tableNumber}
                  </div>
                  
                  <div className="text-sm capitalize mb-3">
                    {table.status.replace('_', ' ')}
                  </div>
                  
                  {table.currentWaiter && (
                    <div className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">Waiter:</span> {table.currentWaiter.name}
                    </div>
                  )}
                  
                  {table.activeCustomerSession && (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{table.activeCustomerSession.occupancy} guests</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{new Date(table.activeCustomerSession.startTime).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                  
                  {hasActiveOrders && (
                    <div className="mt-2 text-xs">
                      <div className="flex items-center text-orange-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        <span>{table.activeOrders.length} active orders</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {isMyTable && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleTableSelect(table.tableNumber)}
                      className="flex-1 py-1 px-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      Select
                    </button>
                    {!table.activeCustomerSession && (
                      <button
                        onClick={() => handleReleaseTable(table.tableNumber)}
                        className="flex-1 py-1 px-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                        title="Release table"
                      >
                        <XCircle className="h-3 w-3" />
                        Release
                      </button>
                    )}
                    <button
                      onClick={() => handleHandoverTable(table.tableNumber, table.currentWaiter?.name)}
                      className="flex-1 py-1 px-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                      title="Handover table to another waiter"
                    >
                      <UserMinus className="h-3 w-3" />
                      Handover
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <TableHandoverModal
        isOpen={handoverModal.isOpen}
        onClose={() => setHandoverModal({ isOpen: false, tableNumber: '', waiterName: undefined })}
        tableNumber={handoverModal.tableNumber}
        currentWaiterName={handoverModal.waiterName}
        onHandoverComplete={() => {
          setHandoverModal({ isOpen: false, tableNumber: '', waiterName: undefined });
          fetchTables(); // Refresh the table list
        }}
        t={t}
      />
    </div>
  );
};