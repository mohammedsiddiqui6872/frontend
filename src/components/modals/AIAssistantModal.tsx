import { useState, useEffect, useRef } from 'react';
import { Bot, X, Mic, MicOff } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore, MenuItem } from '../../stores/cartStore';
import { useMenu } from '../../hooks/useMenu';

interface ConversationMessage {
  type: 'user' | 'assistant';
  message: string;
}

interface AIAssistantModalProps {
  t: any;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ t }) => {
  const { showAI, setShowAI, language } = useUIStore();
  const { addToCart } = useCartStore();
  const { data: menuItems } = useMenu();
  
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAI && conversation.length === 0) {
      const greeting = t.aiGreeting;
      setConversation([{ type: 'assistant', message: greeting }]);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greeting);
        utterance.lang = language === 'ar' ? 'ar-SA' : 
                        language === 'es' ? 'es-ES' : 
                        language === 'ru' ? 'ru-RU' : 
                        language === 'tr' ? 'tr-TR' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 500);
      }
    }
  }, [showAI, conversation.length, t.aiGreeting, language]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  if (!showAI) return null;

  const startListening = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = language === 'ar' ? 'ar-SA' : 
                        language === 'es' ? 'es-ES' : 
                        language === 'ru' ? 'ru-RU' : 
                        language === 'tr' ? 'tr-TR' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      setIsListening(true);
      recognition.start();
      
      recognition.onresult = (event: any) => {
        const userQuery = event.results[0][0].transcript;
        
        let response = "";
        const lowerQuery = userQuery.toLowerCase();
        
        if (lowerQuery.includes("recommend") || lowerQuery.includes("special") || lowerQuery.includes("suggest")) {
          response = "I highly recommend our Chef's Special today - the Caesar Salad is 15% off! It's made with fresh romaine lettuce, homemade croutons, and our signature Caesar dressing. Would you like me to add it to your order?";
        } else if (lowerQuery.includes("caesar") || lowerQuery.includes("salad")) {
          response = "Excellent choice! The Caesar Salad is one of our most popular dishes. Would you like to add grilled chicken, salmon, or shrimp for extra protein?";
          
          // Fixed: Properly type the menu items
          if (menuItems) {
            const allItems: MenuItem[] = Object.values(menuItems).flat() as MenuItem[];
            const caesarSalad = allItems.find((item: MenuItem) => item.name === "Caesar Salad");
            if (caesarSalad) {
              addToCart(caesarSalad);
            }
          }
        } else if (lowerQuery.includes("vegetarian") || lowerQuery.includes("vegan")) {
          response = "We have several vegetarian options! Our Bruschetta is vegan and absolutely delicious. We also have the Caesar Salad without any protein additions. For mains, I can ask the chef to prepare a special vegetarian pasta. What sounds good to you?";
        } else if (lowerQuery.includes("allergy") || lowerQuery.includes("allergic")) {
          response = "Thank you for letting me know about your allergy concerns. Could you please tell me what specific allergies you have? I'll make sure the kitchen is aware and can recommend safe options for you.";
        } else if (lowerQuery.includes("bill") || lowerQuery.includes("check") || lowerQuery.includes("pay")) {
          response = "I'll prepare your bill right away. Would you like to pay by card or cash? And would you like me to bring the card machine to your table?";
        } else {
          response = "I'd be happy to help you with that! Could you please tell me more about what you're looking for? I can recommend dishes, explain ingredients, or help with any dietary requirements.";
        }
        
        const messages: ConversationMessage[] = [
          { type: 'user', message: userQuery },
          { type: 'assistant', message: response }
        ];
        
        setConversation(prev => [...prev, ...messages]);
        
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(response);
          utterance.lang = language === 'ar' ? 'ar-SA' : 
                          language === 'es' ? 'es-ES' : 
                          language === 'ru' ? 'ru-RU' : 
                          language === 'tr' ? 'tr-TR' : 'en-US';
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          window.speechSynthesis.speak(utterance);
        }
        
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone access to use voice commands.');
        } else {
          alert('Sorry, I couldn\'t understand that. Please try again.');
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setTimeout(() => {
        if (isListening) {
          recognition.stop();
          setIsListening(false);
        }
      }, 10000);
      
    } catch (error) {
      
      alert('Please allow microphone access to use voice commands.');
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bot size={32} className="text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold">{t.aiAssistant}</h2>
              <p className="text-sm text-gray-600">Your personal dining companion</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAI(false);
              setConversation([]);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </div>
        
        <div className="border-t p-6">
          <div className="flex items-center gap-3">
            <button
              onClick={startListening}
              disabled={isListening}
              className={`p-4 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
              }`}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {isListening ? t.listening : t.tapToSpeak}
              </p>
              <p className="text-xs text-gray-500">{t.howCanIHelp}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};