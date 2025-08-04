import { useState, useEffect } from 'react';
import { ChefHat, User, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/api.service';

type Language = 'en' | 'es' | 'ru' | 'ar' | 'tr';

interface LoginScreenProps {
  t: any;
  language: Language;
  setLanguage: (lang: Language) => void;
  restaurantName?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ t, language, setLanguage, restaurantName }) => {
  const { setAuth, rememberMe, setRememberMe, getLoginData } = useAuthStore();
  const [localLoginData, setLocalLoginData] = useState({
    employeeId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for remembered data on mount
  useEffect(() => {
    const loginData = getLoginData();
    if (loginData) {
      setLocalLoginData(loginData);
    }
  }, [getLoginData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');

    if (!localLoginData.employeeId || !localLoginData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiService.login({
        email: localLoginData.employeeId,
        password: localLoginData.password
      });
      
      // The RestaurantOrderingSystem component will check for active sessions
      // We just clear localStorage here to ensure clean state
      localStorage.removeItem('customer-session');
      
      setAuth({
        isAuthenticated: true,
        employeeId: localLoginData.employeeId,
        employeeName: result.user?.name || localLoginData.employeeId,
        authToken: result.token,
      });
      
    } catch (error) {
      
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-screen">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <img 
            src="/ic_launcher_round.png" 
            alt="Restaurant Logo" 
            className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg"
            onError={(e) => {
              // Fallback to ChefHat icon if image fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) {
                (fallback as HTMLElement).style.display = 'block';
              }
            }}
          />
          <div style={{ display: 'none' }} className="mx-auto mb-4">
            <ChefHat size={64} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {restaurantName || t.loginTitle}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              {t.employeeIdLabel} (Email)
            </label>
            <input
              type="email"
              value={localLoginData.employeeId}
              onChange={(e) => setLocalLoginData({ ...localLoginData, employeeId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              required
              placeholder="employee@restaurant.com"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              {t.passwordLabel}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={localLoginData.password}
                onChange={(e) => setLocalLoginData({ ...localLoginData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                style={{
                  WebkitAppearance: 'none',
                  msTextCombineHorizontal: 'none',
                  MozAppearance: 'none'
                }}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                style={{ zIndex: 10 }}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-700">
              {t.rememberMeLabel}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg 
                     hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 
                     disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Logging in...
              </>
            ) : (
              t.loginButton
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center gap-4">
          {[
            { lang: 'en' as Language, flag: '🇬🇧', label: 'English' },
            { lang: 'es' as Language, flag: '🇪🇸', label: 'Español' },
            { lang: 'ru' as Language, flag: '🇷🇺', label: 'Русский' },
            { lang: 'ar' as Language, flag: '🇸🇦', label: 'العربية' },
            { lang: 'tr' as Language, flag: '🇹🇷', label: 'Türkçe' }
          ].map(({ lang, flag, label }) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                language === lang 
                  ? 'bg-purple-600 text-white shadow-lg scale-110' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              disabled={isLoading}
              title={label}
            >
              <span className="text-2xl">{flag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};