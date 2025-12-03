import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Полифилл для веб-версии (SecureStore не работает в браузере)
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100: string;
  photo_200: string;
  city?: {
    id: number;
    title: string;
  };
  country?: {
    id: number;
    title: string;
  };
  sex?: number;
  bdate?: string;
  online?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: VKUser | null;
  isPremium: boolean;
  premiumExpiry: Date | null;
  
  // Actions
  login: (token: string, user: VKUser) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setPremium: (expiry: Date) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  isPremium: false,
  premiumExpiry: null,

  login: async (token: string, user: VKUser) => {
    await storage.setItem('vk_access_token', token);
    await storage.setItem('vk_user', JSON.stringify(user));
    
    set({
      isAuthenticated: true,
      accessToken: token,
      user,
    });
  },

  logout: async () => {
    await storage.deleteItem('vk_access_token');
    await storage.deleteItem('vk_user');
    
    set({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      isPremium: false,
      premiumExpiry: null,
    });
  },

  loadSession: async () => {
    try {
      const token = await storage.getItem('vk_access_token');
      const userJson = await storage.getItem('vk_user');
      const premiumExpiry = await storage.getItem('premium_expiry');
      
      if (token && userJson) {
        const user = JSON.parse(userJson) as VKUser;
        let isPremium = false;
        let expiryDate = null;
        
        if (premiumExpiry) {
          expiryDate = new Date(premiumExpiry);
          isPremium = expiryDate > new Date();
        }
        
        set({
          isAuthenticated: true,
          accessToken: token,
          user,
          isPremium,
          premiumExpiry: expiryDate,
        });
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  },

  setPremium: async (expiry: Date) => {
    await storage.setItem('premium_expiry', expiry.toISOString());
    set({
      isPremium: true,
      premiumExpiry: expiry,
    });
  },
}));
