// VK API Configuration
// Приложение зарегистрировано на https://vk.com/apps?act=manage

export const VK_CONFIG = {
  // VK App ID
  clientId: '54373333',
  
  // Версия VK API
  apiVersion: '5.131',
  
  // Необходимые права доступа
  scope: [
    'friends',      // Доступ к списку друзей
    'photos',       // Доступ к фотографиям (для лайков)
    'wall',         // Доступ к стене (посты, лайки)
    'stats',        // Статистика страницы
    'offline',      // Бессрочный токен
    'stories',      // Истории
    'notifications', // Уведомления
  ],
  
  // API endpoints
  apiUrl: 'https://api.vk.com/method',
};

// VK App ID: 54373333
// Настройки приложения: https://vk.com/editapp?id=54373333
