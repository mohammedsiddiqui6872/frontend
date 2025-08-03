import React from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { FlavorJourney } from '../menu/FlavorJourney';
import { useOrders } from '../../hooks/useOrders';

interface FlavorJourneyModalProps {
  t: any;
  customerName: string;
  menuItems: any[];
}

export const FlavorJourneyModal: React.FC<FlavorJourneyModalProps> = ({ t, customerName, menuItems }) => {
  const { showFlavorJourney, setShowFlavorJourney } = useUIStore();
  const { orderHistory } = useOrders();

  if (!showFlavorJourney) return null;

  const handleUnlock = (achievement: any) => {
    // Show notification for unlocked achievement
    const notification = new Notification('Achievement Unlocked!', {
      body: `${achievement.title}: ${achievement.reward}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {customerName}'s Flavor Journey
          </h2>
          <button
            onClick={() => setShowFlavorJourney(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <FlavorJourney
            customerName={customerName}
            orderHistory={orderHistory || []}
            menuItems={menuItems}
            onUnlock={handleUnlock}
          />
        </div>
      </div>
    </div>
  );
};