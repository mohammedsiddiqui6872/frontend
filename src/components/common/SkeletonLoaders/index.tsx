import React from 'react';
import { MenuItemSkeleton } from '../SkeletonLoaders';

export const SkeletonLoaders: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <MenuItemSkeleton key={index} />
      ))}
    </div>
  );
};