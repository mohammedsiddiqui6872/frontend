// src/hooks/useMenu.ts
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service.multi-tenant';
import { useAuthStore } from '../stores/authStore';
import { MenuItem } from '../stores/cartStore';
import { menuTransformService, MenuResponse } from '../services/menuTransform.service';

export const useMenu = () => {
  const authToken = useAuthStore((state) => state.authToken);

  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      if (!authToken) throw new Error('Not authenticated');
      
      const data = await apiService.getMenu();
      
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
    enabled: !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};