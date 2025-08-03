import React, { useState, useEffect, useRef } from 'react';
import { generateWebPSrcSet, generateSrcSet, isWebPSupported } from '../../utils/imageOptimization';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  srcSet?: string;
  enableWebP?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Cpath d="M163.5 120h73l-36.5 60z" fill="%23ddd"/%3E%3Ccircle cx="170" cy="110" r="20" fill="%23ddd"/%3E%3C/svg%3E',
  className = '',
  width,
  height,
  onLoad,
  onError,
  loading = 'lazy',
  sizes,
  srcSet,
  enableWebP = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check WebP support
  useEffect(() => {
    if (enableWebP) {
      isWebPSupported().then(setSupportsWebP);
    }
  }, [enableWebP]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image error
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };

  // Generate appropriate srcSet
  const getImageSrcSet = () => {
    if (srcSet) return srcSet;
    
    if (enableWebP && supportsWebP) {
      return generateWebPSrcSet(src);
    }
    
    return generateSrcSet(src);
  };

  // Generate sizes if not provided
  const generateSizes = () => {
    if (sizes) return sizes;
    return '(max-width: 640px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 60vw, 50vw';
  };

  return (
    <div
      ref={containerRef}
      className={`lazy-image-container ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && !error && (
        <div
          className="lazy-image-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        >
            <img
              src={placeholder}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(10px)',
                transform: 'scale(1.1)',
              }}
            />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="error-state"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            color: '#666',
            opacity: 1,
            transition: 'opacity 0.3s',
          }}
        >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="mt-2 text-sm">Failed to load image</p>
        </div>
      )}

      {/* Actual image */}
      {isInView && !error && enableWebP && supportsWebP ? (
          <picture
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          >
            <source
              srcSet={generateWebPSrcSet(src)}
              sizes={generateSizes()}
              type="image/webp"
            />
            <source
              srcSet={generateSrcSet(src)}
              sizes={generateSizes()}
              type={src.includes('.png') ? 'image/png' : 'image/jpeg'}
            />
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading={loading}
              onLoad={handleLoad}
              onError={handleError}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            />
          </picture>
        ) : isInView && !error && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            srcSet={getImageSrcSet()}
            sizes={generateSizes()}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          />
        )}
    </div>
  );
};

// Higher-order component for easy migration
export const withLazyLoading = <P extends { src: string; alt: string }>(
  Component: React.ComponentType<P>
): React.FC<P & Omit<LazyImageProps, 'src' | 'alt'>> => {
  return (props) => {
    const { src, alt, ...rest } = props;
    const [isLoaded, setIsLoaded] = useState(false);

    if (!isLoaded) {
      return (
        <LazyImage
          src={src}
          alt={alt}
          {...rest}
          onLoad={() => setIsLoaded(true)}
        />
      );
    }

    return <Component {...props} />;
  };
};