import { useEffect } from 'react';
import { 
  Bot, Users, Phone, FileText, Search, Sun, Moon, Globe, Bell, 
  History, ShoppingCart, User, MapPin, Gem, X, Check
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useUIStore } from '../stores/uiStore';
import { useOrders } from '../hooks/useOrders';
import { useNotifications } from '../hooks/useNotifications';

interface HeaderProps {
  t: any;
  taglines: string[];
  onCallWaiter: () => void;
  onRequestBill: () => void;
  tableNumber?: string;
}

export const Header = ({ t, taglines, onCallWaiter, onRequestBill, tableNumber }: HeaderProps) => {
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const { activeOrders } = useOrders();
  const { notifications } = useNotifications();
  
  const {
    showPromo, setShowPromo, showSearch, setShowSearch, searchQuery, setSearchQuery,
    darkMode, setDarkMode, language, setLanguage, showLanguageMenu, setShowLanguageMenu,
    showNotifications, setShowNotifications, showProfileMenu, setShowProfileMenu,
    currentTagline, setCurrentTagline, callWaiterStatus, setShowAI, setShowTableService,
    setShowOrderHistory, setShowCart
  } = useUIStore();

  // Tagline rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      const current = useUIStore.getState().currentTagline;
      const currentIndex = current ? taglines.indexOf(current) : -1;
      const nextIndex = (currentIndex + 1) % taglines.length;
      const nextTagline = taglines[nextIndex];
      if (nextTagline) {
        setCurrentTagline(nextTagline);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [setCurrentTagline, taglines]);

  // Handle click outside for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu && !(event.target as Element).closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
      if (showLanguageMenu && !(event.target as Element).closest('.language-menu-container')) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showLanguageMenu, setShowProfileMenu, setShowLanguageMenu]);

  return (
    <header className="bg-white shadow-xl header-fixed border-b border-gray-100">
      {showPromo && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 md:p-3 relative">
          <div className="flex items-center justify-center gap-3">
            <Gem className="animate-pulse" size={20} />
            <span className="font-semibold text-sm md:text-lg">{t.todaysSpecial}: 15% off Caesar Salad!</span>
            <button onClick={() => setShowPromo(false)} className="absolute right-2 md:right-4">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Action buttons */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setShowAI(true)}
              className="flex flex-col items-center justify-center p-1 md:p-2 transition-all hover:scale-105 group"
              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
              title={t.aiAssistant}
            >
              <Bot size={20} className="md:w-6 md:h-6 text-purple-600" />
              <span className="text-[9px] md:text-xs text-gray-700 font-medium mt-1 hidden md:block">{t.aiAssistant}</span>
            </button>

            <button
              onClick={() => setShowTableService(true)}
              className="flex flex-col items-center justify-center p-1 md:p-2 transition-all hover:scale-105 group"
              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
              title={t.tableService}
            >
              <Users size={20} className="md:w-6 md:h-6 text-purple-600" />
              <span className="text-[9px] md:text-xs text-gray-700 font-medium mt-1 hidden md:block">{t.tableService}</span>
            </button>

            <button
              onClick={onCallWaiter}
              className="flex flex-col items-center justify-center p-1 md:p-2 transition-all hover:scale-105 group"
              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
            >
              {callWaiterStatus === 'calling' ? (
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              ) : callWaiterStatus === 'confirmed' ? (
                <Check size={20} className="text-green-500 md:w-6 md:h-6" />
              ) : (
                <Phone size={20} className="md:w-6 md:h-6 text-purple-600" />
              )}
              <span className="text-[9px] md:text-xs text-gray-700 font-medium mt-1 hidden md:block">{t.callWaiter}</span>
            </button>

            <button
              onClick={onRequestBill}
              className="flex flex-col items-center justify-center p-1 md:p-2 transition-all hover:scale-105 group"
              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
            >
              <FileText size={20} className="md:w-6 md:h-6 text-purple-600" />
              <span className="text-[9px] md:text-xs text-gray-700 font-medium mt-1 hidden md:block">{t.checkout}</span>
            </button>
          </div>

          {/* Center - Restaurant name and tagline */}
          <div className="flex flex-col items-center flex-1 mx-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                         bg-clip-text text-transparent">{t.restaurant}</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1 transition-opacity duration-500">{currentTagline}</p>
          </div>

          {/* Right side utility icons */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 md:p-2 transition-all hover:scale-110"
              style={{ background: 'none', border: 'none' }}
            >
              <Search size={20} className="md:w-6 md:h-6 text-purple-600" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 md:p-2 transition-all hover:scale-110"
              style={{ background: 'none', border: 'none' }}
            >
              {darkMode ?
                <Sun size={20} className="md:w-6 md:h-6 text-purple-600" /> :
                <Moon size={20} className="md:w-6 md:h-6 text-purple-600" />
              }
            </button>

            <div className="relative language-menu-container">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-1.5 md:p-2 transition-all hover:scale-110"
                style={{ background: 'none', border: 'none' }}
              >
                <Globe size={20} className="md:w-6 md:h-6 text-purple-600" />
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {(['en', 'es', 'ru', 'ar', 'tr'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${language === lang ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
                        }`}
                    >
                      <span>{lang === 'en' ? 'English' : lang === 'es' ? 'Español' : lang === 'ru' ? 'Русский' : lang === 'ar' ? 'العربية' : 'Türkçe'}</span>
                      {language === lang && <Check size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 md:p-2 transition-all hover:scale-110 relative"
                style={{ background: 'none', border: 'none' }}
              >
                <Bell size={20} className="md:w-6 md:h-6 text-purple-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full 
                                 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-xs font-bold animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowOrderHistory(true)}
              className="p-1.5 md:p-2 transition-all hover:scale-110 relative"
              style={{ background: 'none', border: 'none' }}
            >
              <History size={20} className="md:w-6 md:h-6 text-purple-600" />
              {activeOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full 
                               w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-xs font-bold animate-pulse">
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowCart(true)}
              className="relative p-1.5 md:p-2 transition-all hover:scale-110"
              style={{ background: 'none', border: 'none' }}
            >
              <ShoppingCart size={20} className="md:w-6 md:h-6 text-purple-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full 
                               w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-xs font-bold animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            <ProfileMenu t={t} />

            {/* Table Number Display - Moved to the very right */}
            {tableNumber && (
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full ml-2">
                <MapPin size={16} className="text-purple-600" />
                <span className="text-sm font-semibold text-purple-600">
                  {t.table || 'Table'} {tableNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="border-t px-4 md:px-6 py-3 md:py-4 bg-gray-50">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none 
                     focus:border-purple-500 transition-colors text-sm md:text-base"
          />
        </div>
      )}
    </header>
  );
};

const ProfileMenu = ({ t }: { t: any }) => {
  const { employeeName } = useAuthStore();
  const { showProfileMenu, setShowProfileMenu, setShowLogoutConfirm } = useUIStore();

  return (
    <div className="relative profile-menu-container">
      <button 
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className="p-1.5 md:p-2 gradient-icon-primary transition-all hover:scale-110"
        style={{ background: 'none', border: 'none' }}
      >
        <User size={20} className="md:w-6 md:h-6" />
      </button>
      
      {showProfileMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{t.employee}</p>
            <p className="text-sm text-gray-500 truncate">{employeeName}</p>
          </div>
          <button
            onClick={() => {
              setShowProfileMenu(false);
              setShowLogoutConfirm(true);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
          >
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );
};

const LogOut = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);