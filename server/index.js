require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret (в продакшене используйте переменную окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// VK API Configuration
const VK_API_VERSION = '5.131';
const VK_API_URL = 'https://api.vk.com/method';
const VK_CLIENT_ID = process.env.VK_CLIENT_ID || '54373333';
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const VK_REDIRECT_URI = process.env.VK_REDIRECT_URI || 'http://localhost:8083/auth/callback';

// ==================== Authentication ====================

/**
 * Обмен code на access_token (VK OAuth)
 */
app.get('/api/auth/vk-callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Обмениваем code на access_token
    const tokenResponse = await axios.get('https://oauth.vk.com/access_token', {
      params: {
        client_id: VK_CLIENT_ID,
        client_secret: VK_CLIENT_SECRET,
        redirect_uri: VK_REDIRECT_URI,
        code: code,
      },
    });

    const { access_token, user_id } = tokenResponse.data;

    // Получаем данные пользователя
    const userResponse = await axios.get(`${VK_API_URL}/users.get`, {
      params: {
        user_ids: user_id,
        fields: 'photo_100,photo_200,city,country,sex,bdate',
        access_token: access_token,
        v: VK_API_VERSION,
      },
    });

    const user = userResponse.data.response[0];

    // Создаём JWT для нашего приложения
    const appToken = jwt.sign(
      { userId: user.id, vkAccessToken: access_token },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Отправляем данные обратно в приложение
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'VK_AUTH_SUCCESS',
              token: '${appToken}',
              user: ${JSON.stringify(user)}
            }, '*');
            window.close();
          </script>
          <p>Авторизация успешна! Это окно можно закрыть.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('VK OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth failed', details: error.response?.data });
  }
});

/**
 * Верификация VK токена и создание JWT для приложения
 */
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { vkAccessToken, vkUserId } = req.body;

    if (!vkAccessToken || !vkUserId) {
      return res.status(400).json({ error: 'Missing vkAccessToken or vkUserId' });
    }

    // Проверяем токен через VK API
    const response = await axios.get(`${VK_API_URL}/users.get`, {
      params: {
        user_ids: vkUserId,
        fields: 'photo_100,photo_200,city,country,sex,bdate',
        access_token: vkAccessToken,
        v: VK_API_VERSION,
      },
    });

    if (response.data.error) {
      return res.status(401).json({ error: 'Invalid VK token' });
    }

    const user = response.data.response[0];

    // Создаём JWT токен для нашего приложения
    const appToken = jwt.sign(
      {
        userId: user.id,
        vkUserId: vkUserId,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: appToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_100: user.photo_100,
        photo_200: user.photo_200,
        city: user.city,
        sex: user.sex,
      },
    });
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ==================== Middleware для проверки JWT ====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// ==================== Subscription Management ====================

// В реальном приложении данные хранятся в базе данных
const subscriptions = new Map();

/**
 * Проверить статус подписки
 */
app.get('/api/subscription/status', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const subscription = subscriptions.get(userId);

  if (!subscription || new Date(subscription.expiry) < new Date()) {
    return res.json({
      isPremium: false,
      expiry: null,
      plan: null,
    });
  }

  res.json({
    isPremium: true,
    expiry: subscription.expiry,
    plan: subscription.plan,
  });
});

/**
 * Активировать подписку (после верификации платежа)
 */
app.post('/api/subscription/activate', authenticateToken, (req, res) => {
  const { plan, transactionId, receipt } = req.body;
  const userId = req.user.userId;

  // В реальном приложении здесь:
  // 1. Верификация receipt через App Store / Google Play
  // 2. Проверка transactionId на уникальность
  // 3. Сохранение в базу данных

  const expiry = new Date();
  switch (plan) {
    case 'weekly':
      expiry.setDate(expiry.getDate() + 7);
      break;
    case 'monthly':
      expiry.setMonth(expiry.getMonth() + 1);
      break;
    case 'yearly':
      expiry.setFullYear(expiry.getFullYear() + 1);
      break;
    default:
      return res.status(400).json({ error: 'Invalid plan' });
  }

  subscriptions.set(userId, {
    plan,
    expiry: expiry.toISOString(),
    transactionId,
    activatedAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    isPremium: true,
    expiry: expiry.toISOString(),
    plan,
  });
});

/**
 * Активировать бонус за просмотр рекламы
 */
app.post('/api/subscription/ad-reward', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // Даём 24 часа премиума за просмотр рекламы
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);

  const existing = subscriptions.get(userId);
  if (existing && new Date(existing.expiry) > new Date()) {
    // Если уже есть подписка - продлеваем
    const newExpiry = new Date(existing.expiry);
    newExpiry.setHours(newExpiry.getHours() + 24);
    existing.expiry = newExpiry.toISOString();
  } else {
    subscriptions.set(userId, {
      plan: 'ad_reward',
      expiry: expiry.toISOString(),
      activatedAt: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    isPremium: true,
    expiry: subscriptions.get(userId).expiry,
    plan: 'ad_reward',
  });
});

// ==================== Analytics ====================

/**
 * Логирование аналитики (просмотры, клики и т.д.)
 */
app.post('/api/analytics/event', authenticateToken, (req, res) => {
  const { event, data } = req.body;
  const userId = req.user.userId;

  // В реальном приложении - сохранение в аналитику
  console.log(`Analytics: User ${userId}, Event: ${event}`, data);

  res.json({ success: true });
});

// ==================== Guest Analysis Cache ====================

// Кэш анализа гостей (в реальном приложении - Redis или база данных)
const guestsCache = new Map();

/**
 * Получить закэшированных гостей
 */
app.get('/api/guests/cached', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const cached = guestsCache.get(userId);

  if (!cached || Date.now() - cached.timestamp > 3600000) {
    // Кэш устарел (1 час)
    return res.json({ cached: false, guests: [] });
  }

  res.json({
    cached: true,
    guests: cached.guests,
    timestamp: cached.timestamp,
  });
});

/**
 * Сохранить результаты анализа в кэш
 */
app.post('/api/guests/cache', authenticateToken, (req, res) => {
  const { guests } = req.body;
  const userId = req.user.userId;

  guestsCache.set(userId, {
    guests,
    timestamp: Date.now(),
  });

  res.json({ success: true });
});

// ==================== Health Check ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🚀 VK Guests Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});
