import { useEffect } from 'react';
import { Users, Phone, Droplets, FileText, UtensilsCrossed, Shield } from 'lucide-react';

type PopupType = 'tableService' | 'waiter' | 'waterRefill' | 'napkins' | 'utensils' | 'condiments';

interface CreativePopupProps {
  type: PopupType;
  onClose: () => void;
}

export const CreativePopup: React.FC<CreativePopupProps> = ({ type, onClose }) => {
  const popupContent = {
    tableService: {
      icon: <Users className="w-20 h-20 text-purple-600 animate-bounce" />,
      title: "Help is on the way! 🏃‍♂️",
      messages: [
        "Our ninja waiters are sprinting to your table!",
        "Your wish is our command! Help incoming in 3... 2... 1...",
        "Table service activated! Prepare for awesomeness!",
        "Our team is zooming your way faster than you can say 'Bella Vista'!"
      ],
      emoji: "🎯"
    },
    waiter: {
      icon: <Phone className="w-20 h-20 text-pink-600 animate-pulse" />,
      title: "Waiter Alert! 🔔",
      messages: [
        "Your personal food hero is on the way!",
        "Summoning the best waiter in the universe...",
        "Help is coming right up, fresh from our team!",
        "Our super waiter heard your call and is rushing over!"
      ],
      emoji: "⚡"
    },
    waterRefill: {
      icon: <Droplets className="w-20 h-20 text-blue-600 animate-bounce" />,
      title: "Water Coming Right Up! 💧",
      messages: [
        "Crystal clear refreshment on the way!",
        "Our water specialist is preparing the finest H2O!",
        "Hydration station activated! Stay thirsty no more!",
        "Ice-cold water delivery in progress!"
      ],
      emoji: "🥤"
    },
    napkins: {
      icon: <FileText className="w-20 h-20 text-green-600 animate-pulse" />,
      title: "Napkins Incoming! 🧻",
      messages: [
        "Extra napkins flying your way!",
        "Our napkin ninja is on a mission!",
        "Cleanliness reinforcements arriving soon!",
        "Premium napkins being dispatched!"
      ],
      emoji: "✨"
    },
    utensils: {
      icon: <UtensilsCrossed className="w-20 h-20 text-orange-600 animate-bounce" />,
      title: "Fresh Utensils Alert! 🍴",
      messages: [
        "Sparkling clean utensils on the move!",
        "Our utensil expert is bringing the good stuff!",
        "Fresh forks, knives, and spoons incoming!",
        "Premium cutlery express delivery!"
      ],
      emoji: "🍽️"
    },
    condiments: {
      icon: <Shield className="w-20 h-20 text-red-600 animate-pulse" />,
      title: "Condiments En Route! 🌶️",
      messages: [
        "Flavor enhancers on the way!",
        "Our sauce sommelier is preparing your selection!",
        "Spice up your life - condiments incoming!",
        "The flavor cavalry is riding to your rescue!"
      ],
      emoji: "🥫"
    }
  };

  const content = popupContent[type] || popupContent.tableService;
  const randomMessage = content.messages[Math.floor(Math.random() * content.messages.length)];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-slideUp animate-fadeIn">
        <div className="text-center">
          <div className="mb-4 relative inline-block">
            {content.icon}
            <span className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-spin">✨</span>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                         bg-clip-text text-transparent mb-3">{content.title}</h3>
          <p className="text-gray-600 text-lg mb-4">{randomMessage}</p>
          <div className="text-5xl animate-pulse">{content.emoji}</div>
        </div>
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-bounce" 
                 style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-bounce" 
                 style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};