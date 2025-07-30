import { X, Droplets, FileText, UtensilsCrossed, Shield } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface TableServiceModalProps {
  t: any;
  onServiceRequest: (type: string) => void;
}

export const TableServiceModal: React.FC<TableServiceModalProps> = ({ t, onServiceRequest }) => {
  const { showTableService, setShowTableService } = useUIStore();

  if (!showTableService) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t.tableService}</h2>
          <button
            onClick={() => setShowTableService(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Droplets, label: t.waterRefill, action: 'waterRefill' },
            { icon: FileText, label: t.extraNapkins, action: 'napkins' },
            { icon: UtensilsCrossed, label: t.newUtensils, action: 'utensils' },
            { icon: Shield, label: t.condiments, action: 'condiments' }
          ].map((service) => (
            <button
              key={service.action}
              onClick={() => {
                onServiceRequest(service.action);
                setShowTableService(false);
              }}
              className="p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-600 hover:shadow-lg 
                       transition-all duration-300 group"
            >
              <service.icon size={32} className="mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium">{service.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};