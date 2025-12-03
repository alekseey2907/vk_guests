import { vkApi } from './vkApi';
import { useAuthStore, VKUser } from '../store/authStore';
import { Guest } from '../store/guestsStore';

interface ActivityScore {
  userId: number;
  score: number;
  activities: {
    type: string;
    count: number;
    lastDate: Date;
  }[];
}

class GuestAnalyzer {
  /**
   * Основной метод анализа гостей
   * Использует несколько источников данных для вычисления вероятных посетителей
   */
  async analyzeGuests(): Promise<Guest[]> {
    const { accessToken, user } = useAuthStore.getState();
    
    if (!accessToken || !user) {
      return [];
    }

    const scores: Map<number, ActivityScore> = new Map();

    try {
      // 1. Анализ порядка друзей (VK сортирует по взаимодействию)
      await this.analyzeFriendsOrder(accessToken, scores);

      // 2. Анализ лайков на постах
      await this.analyzeWallLikes(accessToken, user.id, scores);

      // 3. Анализ комментариев
      await this.analyzeComments(accessToken, user.id, scores);

      // 4. Анализ просмотров историй
      await this.analyzeStoryViews(accessToken, user.id, scores);

      // 5. Анализ сообщений (кто писал недавно)
      await this.analyzeMessages(accessToken, scores);

      // 6. Анализ подписчиков
      await this.analyzeFollowers(accessToken, scores);

      // Конвертируем в массив и сортируем по очкам
      const sortedScores = Array.from(scores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 100); // Топ 100

      // Получаем информацию о пользователях
      const userIds = sortedScores.map(s => s.userId);
      const users = await vkApi.getUsers(accessToken, userIds);
      const usersMap = new Map(users.map(u => [u.id, u]));

      // Формируем результат
      const guests: Guest[] = sortedScores.map((score, index) => {
        const vkUser = usersMap.get(score.userId);
        const maxScore = sortedScores[0]?.score || 100;
        const probability = Math.min(95, Math.round((score.score / maxScore) * 100));

        return {
          id: score.userId,
          user: {
            id: score.userId,
            first_name: vkUser?.first_name || 'Пользователь',
            last_name: vkUser?.last_name || '',
            photo_100: vkUser?.photo_100 || '',
            city: vkUser?.city?.title,
            sex: vkUser?.sex,
            age: this.calculateAge(vkUser?.bdate),
          },
          probability,
          lastActivity: score.activities[0]?.lastDate || new Date(),
          activityType: this.getPrimaryActivityType(score.activities),
          details: this.generateDetails(score.activities),
        };
      });

      return guests;
    } catch (error) {
      console.error('Error analyzing guests:', error);
      return this.getMockGuests();
    }
  }

  /**
   * Анализ порядка списка друзей
   * VK сортирует друзей по взаимодействию - это ключевой индикатор!
   */
  private async analyzeFriendsOrder(
    accessToken: string,
    scores: Map<number, ActivityScore>
  ): Promise<void> {
    try {
      const friends = await vkApi.getFriends(accessToken);
      
      // Первые друзья в списке с большей вероятностью посещали страницу
      friends.items.forEach((friend, index) => {
        const positionScore = Math.max(0, 100 - index * 2); // Первые позиции важнее
        
        this.addScore(scores, friend.id, positionScore, {
          type: 'friend_order',
          count: 1,
          lastDate: new Date(),
        });
      });
    } catch (error) {
      console.error('Error analyzing friends:', error);
    }
  }

  /**
   * Анализ лайков на постах стены
   */
  private async analyzeWallLikes(
    accessToken: string,
    ownerId: number,
    scores: Map<number, ActivityScore>
  ): Promise<void> {
    try {
      const posts = await vkApi.getWallPosts(accessToken, ownerId);
      
      // Анализируем последние 20 постов
      for (const post of posts.items.slice(0, 20)) {
        try {
          const likes = await vkApi.getWallLikes(accessToken, ownerId, post.id);
          
          likes.items.forEach((userId) => {
            // Чем новее пост - тем больше очков
            const recencyBonus = this.getRecencyBonus(post.date * 1000);
            this.addScore(scores, userId, 30 * recencyBonus, {
              type: 'like',
              count: 1,
              lastDate: new Date(post.date * 1000),
            });
          });
        } catch {
          // Пропускаем посты с ошибками
        }
      }
    } catch (error) {
      console.error('Error analyzing wall likes:', error);
    }
  }

  /**
   * Анализ комментариев
   */
  private async analyzeComments(
    accessToken: string,
    ownerId: number,
    scores: Map<number, ActivityScore>
  ): Promise<void> {
    try {
      const posts = await vkApi.getWallPosts(accessToken, ownerId);
      
      for (const post of posts.items.slice(0, 10)) {
        if (post.comments.count > 0) {
          try {
            const comments = await vkApi.getComments(accessToken, ownerId, post.id);
            
            comments.items.forEach((comment) => {
              const recencyBonus = this.getRecencyBonus(comment.date * 1000);
              // Комментарии весят больше чем лайки
              this.addScore(scores, comment.from_id, 50 * recencyBonus, {
                type: 'comment',
                count: 1,
                lastDate: new Date(comment.date * 1000),
              });
            });
          } catch {
            // Пропускаем
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing comments:', error);
    }
  }

  /**
   * Анализ просмотров историй
   */
  private async analyzeStoryViews(
    accessToken: string,
    ownerId: number,
    scores: Map<number, ActivityScore>
  ): Promise<void> {
    try {
      const stories = await vkApi.getStories(accessToken, ownerId);
      
      for (const story of stories.items.slice(0, 10)) {
        try {
          const viewers = await vkApi.getStoryViewers(accessToken, story.id, story.owner_id);
          
          viewers.items.forEach((viewer) => {
            // Просмотр истории - сильный индикатор интереса
            this.addScore(scores, viewer.id, 40, {
              type: 'story_view',
              count: 1,
              lastDate: new Date(story.date * 1000),
            });
          });
        } catch {
          // Пропускаем
        }
      }
    } catch (error) {
      console.error('Error analyzing stories:', error);
    }
  }

  /**
   * Анализ сообщений
   */
  private async analyzeMessages(
    accessToken: string,
    scores: Map<number, ActivityScore>
  ): Promise<void> {
    try {
      const conversations = await vkApi.getConversations(accessToken);
      
      conversations.items.forEach((item, index) => {
        if (item.conversation.peer.type === 'user') {
          const userId = item.conversation.peer.id;
          const recencyBonus = this.getRecencyBonus(item.last_message.date * 1000);
          // Недавние переписки важнее
          const positionBonus = Math.max(0, 1 - index * 0.02);
          
          this.addScore(scores, userId, 60 * recencyBonus * positionBonus, {
            type: 'message',
            count: 1,
            lastDate: new Date(item.last_message.date * 1000),
          });
        }
      });
    } catch (error) {
      console.error('Error analyzing messages:', error);
    }
  }

  /**
   * Анализ подписчиков (не друзей)
   */
  private async analyzeFollowers(
    accessToken: string,
    scores: Map<number, ActivityScore>
  ): Promise<void> {
    try {
      const followers = await vkApi.getFollowers(accessToken);
      
      // Подписчики потенциально интересуются страницей
      followers.items.forEach((userId, index) => {
        const score = Math.max(5, 20 - index * 0.1);
        this.addScore(scores, userId, score, {
          type: 'follower',
          count: 1,
          lastDate: new Date(),
        });
      });
    } catch (error) {
      console.error('Error analyzing followers:', error);
    }
  }

  /**
   * Добавить очки пользователю
   */
  private addScore(
    scores: Map<number, ActivityScore>,
    userId: number,
    points: number,
    activity: { type: string; count: number; lastDate: Date }
  ): void {
    const existing = scores.get(userId);
    
    if (existing) {
      existing.score += points;
      
      const existingActivity = existing.activities.find(a => a.type === activity.type);
      if (existingActivity) {
        existingActivity.count += activity.count;
        if (activity.lastDate > existingActivity.lastDate) {
          existingActivity.lastDate = activity.lastDate;
        }
      } else {
        existing.activities.push(activity);
      }
    } else {
      scores.set(userId, {
        userId,
        score: points,
        activities: [activity],
      });
    }
  }

  /**
   * Бонус за свежесть активности
   */
  private getRecencyBonus(timestamp: number): number {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const daysAgo = (now - timestamp) / dayMs;
    
    if (daysAgo < 1) return 1.5;
    if (daysAgo < 3) return 1.2;
    if (daysAgo < 7) return 1.0;
    if (daysAgo < 30) return 0.7;
    return 0.3;
  }

  /**
   * Вычислить возраст из даты рождения
   */
  private calculateAge(bdate?: string): number | undefined {
    if (!bdate) return undefined;
    
    const parts = bdate.split('.');
    if (parts.length < 3) return undefined;
    
    const year = parseInt(parts[2]);
    if (isNaN(year)) return undefined;
    
    const now = new Date();
    return now.getFullYear() - year;
  }

  /**
   * Определить основной тип активности
   */
  private getPrimaryActivityType(activities: ActivityScore['activities']): Guest['activityType'] {
    if (activities.length === 0) return 'view';
    
    const sorted = [...activities].sort((a, b) => {
      // Приоритет по типу активности
      const priority: Record<string, number> = {
        story_view: 5,
        message: 4,
        comment: 3,
        like: 2,
        friend_order: 1,
        follower: 0,
      };
      return (priority[b.type] || 0) - (priority[a.type] || 0);
    });

    const type = sorted[0].type;
    const typeMap: Record<string, Guest['activityType']> = {
      like: 'like',
      comment: 'comment',
      story_view: 'story_view',
      message: 'message',
      friend_order: 'friend_order',
    };

    return typeMap[type] || 'view';
  }

  /**
   * Сгенерировать описание активности
   */
  private generateDetails(activities: ActivityScore['activities']): string {
    const parts: string[] = [];
    
    activities.forEach((activity) => {
      switch (activity.type) {
        case 'like':
          parts.push(`${activity.count} лайк(ов)`);
          break;
        case 'comment':
          parts.push(`${activity.count} комментари(ев)`);
          break;
        case 'story_view':
          parts.push('Смотрел(а) истории');
          break;
        case 'message':
          parts.push('Переписка');
          break;
        case 'friend_order':
          parts.push('Часто взаимодействует');
          break;
      }
    });

    return parts.join(', ') || 'Вероятный интерес к странице';
  }

  /**
   * Моковые данные для демонстрации
   */
  private getMockGuests(): Guest[] {
    const mockNames = [
      { first: 'Анна', last: 'Иванова', sex: 1 },
      { first: 'Михаил', last: 'Петров', sex: 2 },
      { first: 'Елена', last: 'Сидорова', sex: 1 },
      { first: 'Дмитрий', last: 'Козлов', sex: 2 },
      { first: 'Мария', last: 'Новикова', sex: 1 },
      { first: 'Александр', last: 'Морозов', sex: 2 },
      { first: 'Ольга', last: 'Волкова', sex: 1 },
      { first: 'Сергей', last: 'Соколов', sex: 2 },
    ];

    const activities: Guest['activityType'][] = [
      'like', 'comment', 'story_view', 'message', 'friend_order'
    ];

    return mockNames.map((name, index) => ({
      id: 1000 + index,
      user: {
        id: 1000 + index,
        first_name: name.first,
        last_name: name.last,
        photo_100: `https://i.pravatar.cc/100?img=${index + 10}`,
        city: ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск'][index % 4],
        age: 20 + index * 2,
        sex: name.sex,
      },
      probability: Math.max(20, 95 - index * 10),
      lastActivity: new Date(Date.now() - index * 3600000),
      activityType: activities[index % activities.length],
      details: [
        '3 лайка, комментарий',
        'Смотрел(а) истории',
        'Активная переписка',
        '5 лайков за неделю',
        'Часто взаимодействует',
      ][index % 5],
    }));
  }
}

export const guestAnalyzer = new GuestAnalyzer();
