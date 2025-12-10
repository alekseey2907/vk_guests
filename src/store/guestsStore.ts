import { create } from 'zustand';

export interface Guest {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    photo_100: string;
    city?: string;
    age?: number;
    sex?: number;
  };
  probability: number; // 0-100, вероятность что это гость
  lastActivity: Date;
  activityType: 'like' | 'comment' | 'view' | 'message' | 'friend_order' | 'story_view';
  details: string;
}

export interface DailyStats {
  date: string;
  views: number;
  visitors: number;
  demographics: {
    male: number;
    female: number;
    ageGroups: {
      '18-24': number;
      '25-34': number;
      '35-44': number;
      '45+': number;
    };
    topCities: Array<{ name: string; count: number }>;
  };
}

interface GuestsState {
  guests: Guest[];
  dailyStats: DailyStats[];
  isLoading: boolean;
  lastUpdated: Date | null;
  
  // Actions
  setGuests: (guests: Guest[]) => void;
  setDailyStats: (stats: DailyStats[]) => void;
  setLoading: (loading: boolean) => void;
  refreshData: () => void;
}

export const useGuestsStore = create<GuestsState>((set) => ({
  guests: [],
  dailyStats: [],
  isLoading: false,
  lastUpdated: null,

  setGuests: (guests: Guest[]) => set({ guests, lastUpdated: new Date() }),
  
  setDailyStats: (dailyStats: DailyStats[]) => set({ dailyStats }),
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  refreshData: () => set({ lastUpdated: null }),
}));
