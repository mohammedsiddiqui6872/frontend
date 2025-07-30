import { ChefHat, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface WelcomeScreenProps {
  t: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ t }) => {
  const { showWelcome, setShowWelcome } = useUIStore();

  if (!showWelcome) return null;

  return (
    <div className="welcome-screen">
      <div className="text-center p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <ChefHat size={80} className="mx-auto text-white animate-float" />
        </div>
        <h1 className="text-5xl font-bold mb-2 text-white">{t.welcome}</h1>
        <h2 className="text-6xl font-bold mb-6 text-white welcome-title">{t.restaurant}</h2>
        <p className="text-xl mb-8 text-white/90">{t.tagline}</p>
        <button
          onClick={() => setShowWelcome(false)}
          className="welcome-button"
        >
          {t.orderNow} <ChevronRight size={24} className="inline-block ml-1" />
        </button>
      </div>
    </div>
  );
};