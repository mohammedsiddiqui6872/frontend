/**
 * Image optimization utilities for WebP support and responsive images
 */

interface ImageSources {
  webp?: string;
  fallback: string;
}

interface ResponsiveImageConfig {
  sizes: string;
  srcSet: string;
  webpSrcSet?: string;
}

/**
 * Check if WebP is supported by the browser
 */
export const isWebPSupported = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Generate WebP URL from original image URL
 */
export const getWebPUrl = (originalUrl: string): string => {
  // If it's already a WebP image, return as is
  if (originalUrl.toLowerCase().endsWith('.webp')) {
    return originalUrl;
  }
  
  // For local images, replace extension with .webp
  const urlParts = originalUrl.split('.');
  const extension = urlParts.pop();
  
  if (extension && ['jpg', 'jpeg', 'png'].includes(extension.toLowerCase())) {
    return `${urlParts.join('.')}.webp`;
  }
  
  // For external URLs or URLs without extension, append .webp
  return `${originalUrl}.webp`;
};

/**
 * Generate responsive image srcSet
 */
export const generateSrcSet = (
  baseUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
  return sizes
    .map(size => {
      // For Cloudinary URLs
      if (baseUrl.includes('cloudinary.com')) {
        const transformations = `w_${size},c_scale,f_auto,q_auto`;
        const urlParts = baseUrl.split('/upload/');
        if (urlParts.length === 2) {
          return `${urlParts[0]}/upload/${transformations}/${urlParts[1]} ${size}w`;
        }
      }
      
      // For other URLs, append size parameter
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}w=${size} ${size}w`;
    })
    .join(', ');
};

/**
 * Generate WebP srcSet
 */
export const generateWebPSrcSet = (
  baseUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
  const webpUrl = getWebPUrl(baseUrl);
  return generateSrcSet(webpUrl, sizes);
};

/**
 * Get optimized image sources
 */
export const getOptimizedImageSources = async (
  originalUrl: string
): Promise<ImageSources> => {
  const supportsWebP = await isWebPSupported();
  
  return {
    webp: supportsWebP ? getWebPUrl(originalUrl) : undefined,
    fallback: originalUrl
  };
};

/**
 * Generate picture element sources
 */
export const generatePictureSources = (
  imageUrl: string,
  alt: string,
  className?: string,
  sizes?: string
): {
  sources: Array<{ srcSet: string; type: string }>;
  img: { src: string; alt: string; className?: string; sizes?: string };
} => {
  const webpSrcSet = generateWebPSrcSet(imageUrl);
  const jpegSrcSet = generateSrcSet(imageUrl);
  
  return {
    sources: [
      {
        srcSet: webpSrcSet,
        type: 'image/webp'
      },
      {
        srcSet: jpegSrcSet,
        type: imageUrl.includes('.png') ? 'image/png' : 'image/jpeg'
      }
    ],
    img: {
      src: imageUrl,
      alt,
      className,
      sizes: sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    }
  };
};

/**
 * Preload critical images
 */
export const preloadImage = (imageUrl: string, isWebP: boolean = true): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  
  if (isWebP) {
    link.href = getWebPUrl(imageUrl);
    link.type = 'image/webp';
  } else {
    link.href = imageUrl;
    link.type = imageUrl.includes('.png') ? 'image/png' : 'image/jpeg';
  }
  
  document.head.appendChild(link);
};

/**
 * Convert image to WebP using Canvas API (client-side)
 */
export const convertToWebP = async (
  file: File,
  quality: number = 0.85
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/webp',
          quality
        );
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Lazy load images with Intersection Observer
 */
export const setupLazyLoading = (): void => {
  const images = document.querySelectorAll('img[data-lazy-src]');
  
  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const lazySrc = img.getAttribute('data-lazy-src');
          
          if (lazySrc) {
            img.src = lazySrc;
            img.removeAttribute('data-lazy-src');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  );
  
  images.forEach((img) => imageObserver.observe(img));
};