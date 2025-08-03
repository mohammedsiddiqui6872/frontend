// Enhanced tenant-specific themes with revolutionary design elements

export interface TenantTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    gradient: string;
  };
  animations: {
    style: 'electric' | 'mystical' | 'elegant' | 'playful';
    speed: 'fast' | 'normal' | 'slow';
    intensity: 'subtle' | 'moderate' | 'dramatic';
  };
  effects: {
    particles: boolean;
    glowIntensity: number;
    floatDistance: string;
    morphSpeed: number;
  };
  sounds: {
    ambient?: string;
    buttonClick?: string;
    addToCart?: string;
    orderComplete?: string;
  };
  customCss?: string;
}

export const tenantThemes: Record<string, TenantTheme> = {
  'hardrockcafe': {
    id: 'hardrockcafe',
    name: 'Hard Rock Cafe',
    colors: {
      primary: '#FF0000',
      secondary: '#000000',
      accent: '#FFD700',
      background: '#1a1a1a',
      surface: '#2a2a2a',
      text: '#FFFFFF',
      gradient: 'linear-gradient(45deg, #FF0000 0%, #FFD700 100%)'
    },
    animations: {
      style: 'electric',
      speed: 'fast',
      intensity: 'dramatic'
    },
    effects: {
      particles: true,
      glowIntensity: 50,
      floatDistance: '30px',
      morphSpeed: 6
    },
    sounds: {
      ambient: '/sounds/rock-ambient.mp3',
      buttonClick: '/sounds/guitar-riff.mp3',
      addToCart: '/sounds/drum-hit.mp3',
      orderComplete: '/sounds/crowd-cheer.mp3'
    },
    customCss: `
      .category-island {
        background: linear-gradient(45deg, #FF0000 0%, #FFD700 100%);
        box-shadow: 0 0 60px rgba(255, 0, 0, 0.8);
        animation-duration: 4s;
      }
      
      .menu-item-planet:hover {
        transform: translateZ(60px) rotateY(15deg) scale(1.1);
        box-shadow: 0 30px 60px rgba(255, 215, 0, 0.4);
      }
      
      .electric-pulse {
        position: absolute;
        inset: -5px;
        background: linear-gradient(45deg, transparent, #FFD700, transparent);
        animation: electric-pulse 2s linear infinite;
      }
      
      @keyframes electric-pulse {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  },
  
  'mughlaimagic': {
    id: 'mughlaimagic',
    name: 'Mughlai Magic',
    colors: {
      primary: '#8B4513',
      secondary: '#FFD700',
      accent: '#DC143C',
      background: '#FFF8DC',
      surface: '#FFFFFF',
      text: '#4A4A4A',
      gradient: 'linear-gradient(135deg, #8B4513 0%, #FFD700 50%, #DC143C 100%)'
    },
    animations: {
      style: 'mystical',
      speed: 'normal',
      intensity: 'moderate'
    },
    effects: {
      particles: true,
      glowIntensity: 30,
      floatDistance: '20px',
      morphSpeed: 8
    },
    sounds: {
      ambient: '/sounds/sitar-tabla.mp3',
      buttonClick: '/sounds/tabla-tap.mp3',
      addToCart: '/sounds/bell-ring.mp3',
      orderComplete: '/sounds/dhol-celebration.mp3'
    },
    customCss: `
      .category-island {
        background: radial-gradient(circle at center, #FFD700 0%, #8B4513 100%);
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.6);
        border: 2px solid #FFD700;
      }
      
      .menu-item-planet {
        background: linear-gradient(135deg, #FFF8DC 0%, #FFFFFF 100%);
        border: 1px solid #FFD700;
      }
      
      .mystical-particle {
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #FFD700 0%, transparent 70%);
        border-radius: 50%;
        position: absolute;
        animation: mystical-float 10s linear infinite;
      }
      
      @keyframes mystical-float {
        0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
      }
    `
  },
  
  'bellavista': {
    id: 'bellavista',
    name: 'Bella Vista',
    colors: {
      primary: '#006B3C',
      secondary: '#ED2939',
      accent: '#FFFFFF',
      background: '#FAF9F6',
      surface: '#FFFFFF',
      text: '#333333',
      gradient: 'linear-gradient(90deg, #006B3C 0%, #FFFFFF 50%, #ED2939 100%)'
    },
    animations: {
      style: 'elegant',
      speed: 'slow',
      intensity: 'subtle'
    },
    effects: {
      particles: false,
      glowIntensity: 15,
      floatDistance: '15px',
      morphSpeed: 10
    },
    sounds: {
      ambient: '/sounds/italian-restaurant.mp3',
      buttonClick: '/sounds/wine-glass.mp3',
      addToCart: '/sounds/chef-kiss.mp3',
      orderComplete: '/sounds/opera-flourish.mp3'
    },
    customCss: `
      .category-island {
        background: linear-gradient(135deg, #FFFFFF 0%, #FAF9F6 100%);
        box-shadow: 0 10px 30px rgba(0, 107, 60, 0.2);
        border: 2px solid #006B3C;
      }
      
      .menu-item-planet {
        background: #FFFFFF;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .menu-item-planet:hover {
        transform: translateY(-10px);
        box-shadow: 0 15px 40px rgba(0, 107, 60, 0.15);
      }
      
      .italian-flag-accent {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #006B3C 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #ED2939 66.66%);
      }
    `
  }
};

// Apply tenant theme to DOM
export function applyTenantTheme(tenantId: string) {
  const theme = tenantThemes[tenantId];
  if (!theme) return;

  const root = document.documentElement;
  
  // Apply color variables
  root.style.setProperty('--primary-color', theme.colors.primary);
  root.style.setProperty('--secondary-color', theme.colors.secondary);
  root.style.setProperty('--accent-color', theme.colors.accent);
  root.style.setProperty('--background-color', theme.colors.background);
  root.style.setProperty('--surface-color', theme.colors.surface);
  root.style.setProperty('--text-color', theme.colors.text);
  root.style.setProperty('--gradient', theme.colors.gradient);
  
  // Apply animation variables
  root.style.setProperty('--animation-speed', 
    theme.animations.speed === 'fast' ? '0.7' : 
    theme.animations.speed === 'slow' ? '1.5' : '1'
  );
  root.style.setProperty('--glow-intensity', `0 0 ${theme.effects.glowIntensity}px`);
  root.style.setProperty('--float-distance', theme.effects.floatDistance);
  root.style.setProperty('--morph-speed', `${theme.effects.morphSpeed}s`);
  
  // Add theme class to body
  document.body.className = `theme-${tenantId} animation-${theme.animations.style}`;
  
  // Inject custom CSS
  if (theme.customCss) {
    const styleId = 'tenant-custom-styles';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = theme.customCss;
  }
  
  // Initialize sound effects if available
  if (theme.sounds.ambient) {
    initializeAmbientSound(theme.sounds.ambient);
  }
}

// Initialize ambient sound with user interaction
function initializeAmbientSound(soundUrl: string) {
  let audio: HTMLAudioElement | null = null;
  
  const playAmbient = () => {
    if (!audio) {
      audio = new Audio(soundUrl);
      audio.loop = true;
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Autoplay might be blocked
      });
    }
  };
  
  // Try to play on first user interaction
  document.addEventListener('click', playAmbient, { once: true });
  document.addEventListener('touchstart', playAmbient, { once: true });
}

// Get theme for current tenant
export function getCurrentTheme(): TenantTheme | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const subdomain = parts[0];
  
  if (subdomain && subdomain in tenantThemes) {
    return tenantThemes[subdomain as keyof typeof tenantThemes] || null;
  }
  return null;
}