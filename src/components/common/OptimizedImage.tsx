import { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/placeholder.jpg',
  loading = 'lazy',
  sizes,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover',
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc: string): string => {
    // Check if it's a Cloudinary URL or similar CDN
    if (baseSrc.includes('cloudinary.com')) {
      const widths = [320, 640, 768, 1024, 1280];
      return widths
        .map(w => {
          const url = baseSrc.replace('/upload/', `/upload/w_${w},f_auto,q_auto/`);
          return `${url} ${w}w`;
        })
        .join(', ');
    }
    return '';
  };

  // Convert to WebP if supported
  const getOptimizedSrc = (originalSrc: string): string => {
    if (!originalSrc) return fallbackSrc;

    // Check WebP support
    const supportsWebP = typeof window !== 'undefined' && 
      window.document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;

    // For Cloudinary URLs
    if (originalSrc.includes('cloudinary.com') && supportsWebP) {
      return originalSrc.replace('/upload/', '/upload/f_webp,q_auto/');
    }

    // For local images, assume WebP versions exist
    if (supportsWebP && !originalSrc.includes('http')) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    return originalSrc;
  };

  // Intersection Observer for true lazy loading
  useEffect(() => {
    if (loading !== 'lazy' || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loading]);

  // Update image source when in view
  useEffect(() => {
    if (isInView) {
      setImageSrc(getOptimizedSrc(src));
    }
  }, [src, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    // Try fallback
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    
    onError?.();
  };

  const containerStyle = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${
        aspectRatio ? 'w-full' : ''
      }`}
      style={containerStyle}
    >
      {/* Loading skeleton */}
      {isLoading && isInView && (
        <div className="absolute inset-0 animate-pulse">
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <ImageOff size={48} className="mx-auto mb-2" />
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}

      {/* Image */}
      {isInView && (
        <picture>
          {/* WebP source */}
          {imageSrc.includes('.webp') && (
            <source
              srcSet={generateSrcSet(imageSrc)}
              sizes={sizes}
              type="image/webp"
            />
          )}
          
          {/* Original format fallback */}
          <source
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            type={src.includes('.png') ? 'image/png' : 'image/jpeg'}
          />
          
          <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={`${className} ${
              aspectRatio ? 'absolute inset-0 w-full h-full' : ''
            } ${hasError ? 'hidden' : ''}`}
            style={{ objectFit }}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
          />
        </picture>
      )}

      {/* Low quality image placeholder (LQIP) */}
      {isLoading && !isInView && (
        <div 
          className="absolute inset-0 blur-lg transform scale-110"
          style={{
            backgroundImage: `url(${src.replace('/upload/', '/upload/w_50,q_10,f_auto/')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = (urls: string[]) => {
  useEffect(() => {
    const preloadImage = (url: string) => {
      const img = new Image();
      img.src = url;
    };

    urls.forEach(url => {
      if (url) {
        preloadImage(url);
      }
    });
  }, [urls]);
};