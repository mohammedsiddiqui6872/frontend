import { useState } from 'react';
import { X } from 'lucide-react';
import { MenuItem } from '../../stores/cartStore';

interface CustomizationModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, customizations: { [key: string]: string }, specialRequests: string) => void;
  t: any;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  item,
  onClose,
  onAddToCart,
  t,
}) => {
  const [selectedCustomizations, setSelectedCustomizations] = useState<{ [key: string]: string }>({});
  const [specialRequests, setSpecialRequests] = useState('');

  if (!item) return null;

  const handleAddToCart = () => {
    onAddToCart(item, selectedCustomizations, specialRequests);
    setSelectedCustomizations({});
    setSpecialRequests('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t.customize} {item.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(item.customizations).map(([category, options]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3">{category}</h3>
              <div className="space-y-2">
                {options.map(option => (
                  <label key={option} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={category}
                      value={option}
                      checked={selectedCustomizations[category] === option}
                      onChange={(e) => setSelectedCustomizations({
                        ...selectedCustomizations,
                        [category]: e.target.value
                      })}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h3 className="font-semibold mb-3">Special Requests</h3>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests?"
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:border-purple-500"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all duration-300"
          >
            {t.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
};