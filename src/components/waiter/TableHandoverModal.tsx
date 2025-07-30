import React, { useState, useEffect } from 'react';
import { X, UserCheck, Clock, AlertCircle, Loader } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/api.service';

interface Waiter {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
}

interface TableHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  currentWaiterName?: string;
  onHandoverComplete: () => void;
  t: any;
}

export const TableHandoverModal: React.FC<TableHandoverModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  currentWaiterName,
  onHandoverComplete,
  t
}) => {
  const { authToken } = useAuthStore();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchActiveWaiters();
    }
  }, [isOpen]);

  const fetchActiveWaiters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.fetchWithAuth('/admin/users?role=waiter&isActive=true', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch waiters');
      }
      
      const data = await response.json();
      // Filter out the current waiter
      const availableWaiters = data.users.filter((w: Waiter) => 
        w.email !== useAuthStore.getState().employeeId
      );
      setWaiters(availableWaiters);
    } catch (err) {
      console.error('Error fetching waiters:', err);
      setError('Failed to load available waiters');
    } finally {
      setLoading(false);
    }
  };

  const handleHandover = async () => {
    if (!selectedWaiter || !reason.trim()) {
      setError('Please select a waiter and provide a reason');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiService.fetchWithAuth('/auth/handover-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          tableNumber,
          toWaiterId: selectedWaiter,
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Handover failed');
      }

      // Success
      onHandoverComplete();
      onClose();
    } catch (err) {
      console.error('Handover error:', err);
      setError(err instanceof Error ? err.message : 'Failed to handover table');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Handover Table {tableNumber}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={submitting}
          >
            <X size={24} />
          </button>
        </div>

        {currentWaiterName && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Currently assigned to: <strong>{currentWaiterName}</strong>
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <Loader className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading available waiters...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Waiter to Handover To
              </label>
              <select
                value={selectedWaiter}
                onChange={(e) => setSelectedWaiter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                disabled={submitting}
              >
                <option value="">Choose a waiter...</option>
                {waiters.map((waiter) => (
                  <option key={waiter._id} value={waiter._id}>
                    {waiter.name} - {waiter.email}
                    {waiter.lastLogin && (
                      ` (Last login: ${new Date(waiter.lastLogin).toLocaleString()})`
                    )}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Handover
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                rows={3}
                placeholder="e.g., End of shift, Break time, Customer request..."
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleHandover}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={submitting || !selectedWaiter || !reason.trim()}
              >
                {submitting ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserCheck size={20} />
                    Handover Table
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};