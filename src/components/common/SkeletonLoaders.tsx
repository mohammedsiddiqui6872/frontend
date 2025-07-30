
// Skeleton base component with shimmer effect
const SkeletonBase: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} />
);

// Menu Item Skeleton
export const MenuItemSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
    <SkeletonBase className="h-56 w-full" />
    <div className="p-5">
      <div className="flex items-start justify-between mb-2">
        <SkeletonBase className="h-6 w-32 rounded" />
        <SkeletonBase className="h-8 w-20 rounded" />
      </div>
      <SkeletonBase className="h-4 w-full rounded mb-2" />
      <SkeletonBase className="h-4 w-3/4 rounded mb-4" />
      <div className="flex items-center gap-4 mb-3">
        <SkeletonBase className="h-4 w-16 rounded" />
        <SkeletonBase className="h-4 w-20 rounded" />
      </div>
      <SkeletonBase className="h-12 w-full rounded-full" />
    </div>
  </div>
);

// Category Sidebar Skeleton
export const CategorySkeleton: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-2 md:p-3">
    <SkeletonBase className="w-8 h-8 md:w-10 md:h-10 rounded-lg mb-1" />
    <SkeletonBase className="h-3 w-16 rounded" />
  </div>
);

// Order Item Skeleton
export const OrderItemSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-5 w-20 rounded" />
        <SkeletonBase className="h-6 w-24 rounded-full" />
      </div>
      <SkeletonBase className="h-4 w-32 rounded" />
    </div>
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-4 w-40 rounded" />
      <div className="flex gap-2">
        <SkeletonBase className="h-4 w-20 rounded" />
        <SkeletonBase className="h-4 w-16 rounded" />
      </div>
    </div>
  </div>
);

// Cart Item Skeleton
export const CartItemSkeleton: React.FC = () => (
  <div className="border rounded-xl p-4">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <SkeletonBase className="h-5 w-32 rounded mb-2" />
        <SkeletonBase className="h-4 w-24 rounded" />
      </div>
      <SkeletonBase className="h-5 w-5 rounded" />
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-8 w-8 rounded-full" />
        <SkeletonBase className="h-5 w-8 rounded" />
        <SkeletonBase className="h-8 w-8 rounded-full" />
      </div>
      <SkeletonBase className="h-5 w-20 rounded" />
    </div>
  </div>
);