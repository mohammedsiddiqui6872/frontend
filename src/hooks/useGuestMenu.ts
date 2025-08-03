// src/hooks/useGuestMenu.ts
import { useQuery } from '@tanstack/react-query';
import { guestApiService } from '../services/guest-api.service';
import { getGuestSession } from '../config/guest-mode.config';
import { menuTransformService, MenuResponse } from '../services/menuTransform.service';

export const useGuestMenu = () => {
  const guestSession = getGuestSession();

  return useQuery({
    queryKey: ['guest-menu', guestSession?.tableNumber],
    queryFn: async () => {
      if (!guestSession) throw new Error('No guest session');
      
      const data = await guestApiService.getMenuItems();
      
      // Transform the menu data using our enterprise-grade service
      if (Array.isArray(data)) {
        // If it's an array, group it first
        const groupedItems = data.reduce((acc: MenuResponse, item: any) => {
          const category = item.category || 'uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category]!.push(item); // Non-null assertion since we just created it
          return acc;
        }, {} as MenuResponse);
        
        return menuTransformService.transformMenuResponse(groupedItems);
      } else {
        // If it's already grouped (object), transform it
        return menuTransformService.transformMenuResponse(data as MenuResponse);
      }
    },
    enabled: !!guestSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};