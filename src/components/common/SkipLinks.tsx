import React from 'react';
import './SkipLinks.css';

interface SkipLink {
  id: string;
  text: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links = [
    { id: 'main-content', text: 'Skip to main content' },
    { id: 'navigation', text: 'Skip to navigation' },
    { id: 'cart', text: 'Skip to cart' }
  ] 
}) => {
  const handleSkipLink = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    
    if (target) {
      // Make the target focusable if it isn't already
      const originalTabIndex = target.tabIndex;
      target.tabIndex = -1;
      target.focus();
      
      // Restore original tabindex after focus
      if (originalTabIndex === null || originalTabIndex === undefined) {
        target.removeAttribute('tabindex');
      } else {
        target.tabIndex = originalTabIndex;
      }
      
      // Smooth scroll to the element
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="skip-links">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
          onClick={(e) => handleSkipLink(e, link.id)}
        >
          {link.text}
        </a>
      ))}
    </div>
  );
};