import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, Mic, Heart, Brain, Zap } from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { MenuItem } from '../../stores/cartStore';
import '../../styles/revolutionary-design.css';

// Simple motion components without framer-motion for now
const motion = {
  div: (props: any) => <div {...props} />,
  button: (props: any) => <button {...props} />
};

const AnimatePresence = ({ children }: any) => <>{children}</>;

interface MenuUniverseProps {
  categories: any[];
  menuItems: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  userMood?: 'hungry' | 'relaxed' | 'celebration';
}

export const MenuUniverse: React.FC<MenuUniverseProps> = ({
  categories,
  menuItems,
  onItemSelect,
  userMood = 'relaxed'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [userHeartRate, setUserHeartRate] = useState(70);
  const [showGesture, setShowGesture] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Simulated biometric data (in production, connect to real sensors)
  useEffect(() => {
    const interval = setInterval(() => {
      setUserHeartRate(prev => prev + (Math.random() - 0.5) * 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Voice command handler
  const handleVoiceCommand = () => {
    setIsVoiceActive(!isVoiceActive);
    triggerHaptic('medium');
    
    if (!isVoiceActive) {
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Voice commands are not supported in your browser. Try using Chrome or Edge.');
        setIsVoiceActive(false);
        return;
      }
      
      try {
        // Initialize voice recognition
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
          
        };
        
        recognition.onresult = (event: any) => {
          const command = event.results[0][0].transcript.toLowerCase();
          
          alert(`You said: "${command}". Voice ordering coming soon!`);
          setIsVoiceActive(false);
        };
        
        recognition.onerror = (event: any) => {
          
          alert('Voice recognition failed. Please try again.');
          setIsVoiceActive(false);
        };
        
        recognition.onend = () => {
          setIsVoiceActive(false);
        };
        
        recognition.start();
      } catch (error) {
        
        alert('Failed to start voice recognition. Please check your microphone permissions.');
        setIsVoiceActive(false);
      }
    }
  };

  // Gesture detection
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0 && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0 && e.changedTouches[0]) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Swipe detection
        if (Math.abs(deltaX) > 50) {
          setShowGesture(true);
          setTimeout(() => setShowGesture(false), 1000);
          triggerHaptic('light');
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [triggerHaptic]);

  // Category island positions
  const getCategoryPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI;
    const radius = 200;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`menu-universe-container ${userMood}-mode`}
    >
      {/* Background Effects */}
      <div className="menu-universe-bg" />
      
      {/* Floating Category Islands */}
      <div className="category-constellation">
        {categories.map((category, index) => {
          const position = getCategoryPosition(index, categories.length);
          return (
            <div
              key={category._id}
              className={`category-island ${selectedCategory === category.slug ? 'selected' : ''}`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${selectedCategory === category.slug ? 1.2 : 1})`,
                opacity: 1,
                transition: 'all 0.5s ease-out'
              }}
              onClick={() => {
                setSelectedCategory(category.slug);
                triggerHaptic('medium');
              }}
            >
              <div className="category-content glass-panel">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="category-icon"
                />
                <h3 className="category-name">{category.name}</h3>
                <div className="category-glow" />
              </div>
              
              {/* Orbiting menu items */}
              {selectedCategory === category.slug && (
                <div className="menu-items-orbit">
                  {menuItems
                    .filter(item => item.category === category.slug)
                    .slice(0, 5)
                    .map((item, itemIndex) => (
                      <div
                        key={item._id}
                        className="menu-item-planet"
                        style={{
                          opacity: 1,
                          transform: `rotate(${itemIndex * 72}deg) translateX(100px) rotate(-${itemIndex * 72}deg)`,
                          transition: 'all 0.3s ease-out'
                        }}
                        onClick={() => {
                          onItemSelect(item);
                          triggerHaptic('heavy');
                        }}
                      >
                        <div className="ingredient-particle" />
                        <img src={item.image} alt={item.name} />
                        <span className="item-price">${item.price}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Biometric Mood Indicator */}
      <button 
        className="mood-indicator"
        style={{
          animation: `pulse ${60 / userHeartRate}s ease-in-out infinite`,
          cursor: 'pointer',
          border: 'none',
          outline: 'none'
        }}
        onClick={() => {
          triggerHaptic('light');
          alert(`Your mood is ${userMood}! We'll recommend dishes that match your vibe.`);
        }}
      >
        <Heart className="w-6 h-6 text-white" />
        <span className="heart-rate">{Math.round(userHeartRate)}</span>
      </button>

      {/* Voice Command Interface */}
      <button
        className={`voice-command-btn ${isVoiceActive ? 'active' : ''}`}
        onClick={handleVoiceCommand}
      >
        <Mic className={`w-6 h-6 ${isVoiceActive ? 'animate-pulse' : ''}`} />
      </button>

      {/* Gesture Guide */}
      <AnimatePresence>
        {showGesture && (
          <div
            className="gesture-guide active"
            style={{ opacity: showGesture ? 1 : 0, transition: 'opacity 0.3s ease' }}
          >
            <svg width="200" height="100">
              <path
                className="gesture-path"
                d="M 20 50 Q 100 20 180 50"
              />
            </svg>
            <p>Swipe to explore more</p>
          </div>
        )}
      </AnimatePresence>

      {/* Sound Wave Visualizer */}
      <div className="sound-wave">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="wave-bar" />
        ))}
      </div>

      {/* AI Assistant Floating Button */}
      <button
        className="ai-assistant-float"
        style={{
          animation: 'float-rotate 4s ease-in-out infinite'
        }}
        onClick={() => {
          triggerHaptic('medium');
          alert('AI Assistant coming soon! This feature will help you discover dishes based on your preferences.');
        }}
      >
        <Brain className="w-6 h-6" />
        <Sparkles className="sparkle-effect" />
      </button>

      {/* Haptic Feedback Indicator */}
      <div className="haptic-pulse" />
    </div>
  );
};