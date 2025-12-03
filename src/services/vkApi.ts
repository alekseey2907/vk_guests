import axios from 'axios';
import { VK_CONFIG } from '../config/vk';
import { VKUser } from '../store/authStore';

interface VKResponse<T> {
  response: T;
  error?: {
    error_code: number;
    error_msg: string;
  };
}

class VKApi {
  private baseUrl = VK_CONFIG.apiUrl;
  private version = VK_CONFIG.apiVersion;

  private async request<T>(
    method: string,
    accessToken: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/${method}`;
    
    const response = await axios.get<VKResponse<T>>(url, {
      params: {
        ...params,
        access_token: accessToken,
        v: this.version,
      },
    });

    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }

    return response.data.response;
  }

  // Получить информацию о пользователе
  async getUser(accessToken: string, userId: number): Promise<VKUser> {
    const users = await this.request<VKUser[]>('users.get', accessToken, {
      user_ids: userId,
      fields: 'photo_100,photo_200,city,country,sex,bdate,online',
    });
    return users[0];
  }

  // Получить список друзей
  async getFriends(accessToken: string, userId?: number): Promise<{
    count: number;
    items: VKUser[];
  }> {
    return this.request('friends.get', accessToken, {
      user_id: userId,
      fields: 'photo_100,city,sex,bdate,online,last_seen',
      order: 'hints', // Сортировка по рейтингу (важно для анализа!)
    });
  }

  // Получить подписчиков
  async getFollowers(accessToken: string, userId?: number): Promise<{
    count: number;
    items: number[];
  }> {
    return this.request('users.getFollowers', accessToken, {
      user_id: userId,
      count: 1000,
    });
  }

  // Получить лайки на посты пользователя
  async getWallLikes(accessToken: string, ownerId: number, postId: number): Promise<{
    count: number;
    items: number[];
  }> {
    return this.request('likes.getList', accessToken, {
      type: 'post',
      owner_id: ownerId,
      item_id: postId,
      extended: 1,
    });
  }

  // Получить посты со стены
  async getWallPosts(accessToken: string, ownerId?: number): Promise<{
    count: number;
    items: Array<{
      id: number;
      date: number;
      likes: { count: number };
      comments: { count: number };
      reposts: { count: number };
      views?: { count: number };
    }>;
  }> {
    return this.request('wall.get', accessToken, {
      owner_id: ownerId,
      count: 100,
      extended: 1,
    });
  }

  // Получить комментарии к посту
  async getComments(accessToken: string, ownerId: number, postId: number): Promise<{
    count: number;
    items: Array<{
      id: number;
      from_id: number;
      date: number;
      text: string;
    }>;
  }> {
    return this.request('wall.getComments', accessToken, {
      owner_id: ownerId,
      post_id: postId,
      extended: 1,
      count: 100,
    });
  }

  // Получить просмотры историй
  async getStoryViewers(accessToken: string, storyId: number, ownerId: number): Promise<{
    count: number;
    items: VKUser[];
  }> {
    try {
      return await this.request('stories.getViewers', accessToken, {
        story_id: storyId,
        owner_id: ownerId,
        extended: 1,
      });
    } catch {
      return { count: 0, items: [] };
    }
  }

  // Получить истории пользователя
  async getStories(accessToken: string, ownerId?: number): Promise<{
    count: number;
    items: Array<{
      id: number;
      owner_id: number;
      date: number;
      views: number;
    }>;
  }> {
    try {
      const response = await this.request<any>('stories.get', accessToken, {
        owner_id: ownerId,
        extended: 1,
      });
      return response;
    } catch {
      return { count: 0, items: [] };
    }
  }

  // Получить информацию о нескольких пользователях
  async getUsers(accessToken: string, userIds: number[]): Promise<VKUser[]> {
    if (userIds.length === 0) return [];
    
    return this.request('users.get', accessToken, {
      user_ids: userIds.join(','),
      fields: 'photo_100,city,sex,bdate,online,last_seen',
    });
  }

  // Статистика страницы (если доступна)
  async getProfileStats(accessToken: string): Promise<any> {
    try {
      return await this.request('stats.get', accessToken, {
        interval: 'day',
        intervals_count: 7,
      });
    } catch {
      return null;
    }
  }

  // Получить входящие сообщения (кто писал)
  async getConversations(accessToken: string): Promise<{
    count: number;
    items: Array<{
      conversation: {
        peer: {
          id: number;
          type: string;
        };
      };
      last_message: {
        date: number;
        from_id: number;
      };
    }>;
  }> {
    try {
      return await this.request('messages.getConversations', accessToken, {
        count: 200,
        extended: 1,
      });
    } catch {
      return { count: 0, items: [] };
    }
  }
}

export const vkApi = new VKApi();
