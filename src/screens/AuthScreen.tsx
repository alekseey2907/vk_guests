import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store/authStore';
import { VK_CONFIG } from '../config/vk';
import { vkApi } from '../services/vkApi';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const { login, loadSession } = useAuthStore();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    loadSession();
    
    // Загружаем VK ID SDK для веба
    if (Platform.OS === 'web') {
      loadVKIDSDK();
    }
  }, []);

  const loadVKIDSDK = () => {
    // Проверяем, не загружен ли уже SDK
    // @ts-ignore
    if (window.VKIDSDK) {
      initVKID();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.async = true;
    script.onload = initVKID;
    script.onerror = () => console.error('Failed to load VK ID SDK');
    document.head.appendChild(script);
  };

  const initVKID = () => {
    try {
      // @ts-ignore
      if (!window.VKIDSDK) return;

      // @ts-ignore
      const VKID = window.VKIDSDK;

      VKID.Config.init({
        app: parseInt(VK_CONFIG.clientId),
        redirectUrl: 'https://oauth.vk.com/blank.html',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: VK_CONFIG.scope.join(' '),
      });

      console.log('VK ID SDK initialized');
    } catch (error) {
      console.error('VK ID SDK init error:', error);
    }
  };

  // Авторизация через VK ID OneTap
  const handleVKLogin = async () => {
    try {
      if (Platform.OS === 'web') {
        // @ts-ignore
        if (!window.VKIDSDK) {
          alert('VK ID SDK не загружен. Обновите страницу.');
          return;
        }

        // @ts-ignore
        const VKID = window.VKIDSDK;

        // Создаём OneTap виджет
        const oneTap = new VKID.OneTap();

        // Создаём контейнер для виджета
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.zIndex = '10000';
        container.style.backgroundColor = 'white';
        container.style.padding = '20px';
        container.style.borderRadius = '12px';
        container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        document.body.appendChild(container);

        oneTap.render({
          container: container,
          showAlternativeLogin: true
        })
        .on(VKID.WidgetEvents.ERROR, (error: any) => {
          console.error('VK ID Error:', error);
          document.body.removeChild(container);
          alert('Ошибка авторизации VK ID');
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
          console.log('VK ID Login Success:', payload);
          
          try {
            // Обмениваем code на access_token
            const authData = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
            console.log('Auth data:', authData);
            
            if (authData.access_token && authData.user_id) {
              // Получаем данные пользователя
              await handleVKIDSuccess(authData.access_token, authData.user_id);
            }
          } catch (error) {
            console.error('Exchange code error:', error);
            alert('Не удалось получить токен доступа');
          } finally {
            document.body.removeChild(container);
          }
        });
      } else {
        // Для мобильных - старый способ
        const redirectUri = 'https://oauth.vk.com/blank.html';
        const authUrl = `https://oauth.vk.com/authorize?` +
          `client_id=${VK_CONFIG.clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&scope=${VK_CONFIG.scope.join(',')}` +
          `&response_type=token` +
          `&v=${VK_CONFIG.apiVersion}` +
          `&display=mobile`;
        
        await WebBrowser.openBrowserAsync(authUrl);
        setShowTokenModal(true);
      }
    } catch (error) {
      console.error('VK Login error:', error);
      alert('Ошибка при авторизации');
    }
  };

  // Обработка успешной авторизации через VK ID
  const handleVKIDSuccess = async (accessToken: string, userId: number) => {
    try {
      // Получаем данные пользователя через JSONP
      const callbackName = 'vkCallback' + Date.now();
      const apiUrl = `https://api.vk.com/method/users.get?user_ids=${userId}&access_token=${accessToken}&v=${VK_CONFIG.apiVersion}&fields=photo_100,photo_200,city,sex&callback=${callbackName}`;

      const data: any = await new Promise((resolve, reject) => {
        // @ts-ignore
        window[callbackName] = (response: any) => {
          // @ts-ignore
          delete window[callbackName];
          document.body.removeChild(script);
          resolve(response);
        };

        const script = document.createElement('script');
        script.src = apiUrl;
        script.onerror = () => {
          // @ts-ignore
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('Failed to load VK API'));
        };
        document.body.appendChild(script);
      });

      if (data.response && data.response[0]) {
        await login(accessToken, data.response[0]);
      }
    } catch (error) {
      console.error('Get user error:', error);
      alert('Не удалось получить данные пользователя');
    }
  };

  // Обработка токена
  const handleTokenSubmit = async () => {
    try {
      let input = tokenInput.trim();
      
      if (!input) {
        alert('Вставьте URL из адресной строки VK');
        return;
      }

      console.log('Input:', input);

      // Извлекаем access_token из URL
      let token = '';
      let userId = 0;

      // Проверяем разные форматы
      if (input.includes('#access_token=')) {
        // Формат: https://oauth.vk.com/blank.html#access_token=...&user_id=...
        const hashPart = input.split('#')[1];
        const params = new URLSearchParams(hashPart);
        token = params.get('access_token') || '';
        userId = parseInt(params.get('user_id') || '0');
      } else if (input.includes('access_token=')) {
        // Формат: access_token=...&user_id=...
        const params = new URLSearchParams(input.includes('?') ? input.split('?')[1] : input);
        token = params.get('access_token') || '';
        userId = parseInt(params.get('user_id') || '0');
      } else if (input.startsWith('vk1.')) {
        // Просто токен
        token = input;
      }

      console.log('Extracted token:', token.substring(0, 20) + '...');
      console.log('User ID:', userId);

      if (!token) {
        alert('Не удалось извлечь токен из URL. Убедитесь, что скопировали полный адрес.');
        return;
      }

      // Получаем данные пользователя через VK API используя JSONP для обхода CORS
      const callbackName = 'vkCallback' + Date.now();
      const apiUrl = `https://api.vk.com/method/users.get?user_ids=${userId || ''}&access_token=${token}&v=${VK_CONFIG.apiVersion}&fields=photo_100,photo_200,city,sex&callback=${callbackName}`;

      const data: any = await new Promise((resolve, reject) => {
        // @ts-ignore
        window[callbackName] = (response: any) => {
          // @ts-ignore
          delete window[callbackName];
          document.body.removeChild(script);
          resolve(response);
        };

        const script = document.createElement('script');
        script.src = apiUrl;
        script.onerror = () => {
          // @ts-ignore
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('Failed to load VK API'));
        };
        document.body.appendChild(script);
      });

      console.log('VK API response:', data);

      if (data.error) {
        alert(`Ошибка VK API: ${data.error.error_msg}`);
        return;
      }

      if (data.response && data.response[0]) {
        const user = data.response[0];
        await login(token, user);
        setShowTokenModal(false);
        setTokenInput('');
      } else {
        alert('Не удалось получить данные пользователя');
      }
    } catch (error) {
      console.error('Token error:', error);
      alert('Ошибка при обработке токена. Проверьте консоль (F12).');
    }
  };

  // Демо-режим для тестирования интерфейса
  const handleDemoLogin = async () => {
    const demoUser = {
      id: 1,
      first_name: 'Тестовый',
      last_name: 'Пользователь',
      photo_100: 'https://vk.com/images/camera_100.png',
      photo_200: 'https://vk.com/images/camera_200.png',
    };
    await login('demo_token', demoUser);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>VK</Text>
            </View>
            <Text style={styles.title}>Гости</Text>
            <Text style={styles.subtitle}>
              Узнай, кто следит за твоей страницей
            </Text>
          </View>

          <View style={styles.features}>
            <FeatureItem text="Анализ активности в реальном времени" />
            <FeatureItem text="AI-алгоритмы определения гостей" />
            <FeatureItem text="Детальная статистика и аналитика" />
          </View>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleDemoLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.demoButtonText}>
              Попробовать демо
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.vkButton}
            onPress={handleVKLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.vkButtonText}>
              Войти через ВКонтакте
            </Text>
          </TouchableOpacity>

          <Text style={styles.vkNote}>
            VK авторизация требует настройки базового домена
          </Text>

          <Text style={styles.disclaimer}>
            Мы не храним ваш пароль.{'\n'}
            Авторизация происходит через официальный VK OAuth.
          </Text>
        </View>
      </LinearGradient>

      {/* Modal для ввода токена */}
      <Modal
        visible={showTokenModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTokenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Скопируйте токен</Text>
            <Text style={styles.modalHint}>
              <Text style={{fontWeight: 'bold'}}>Инструкция:{'\n'}</Text>
              1. Войдите в VK в открывшемся окне{'\n'}
              2. После входа вы увидите пустую страницу{'\n'}
              3. Скопируйте ВЕСЬ URL из адресной строки{'\n'}
              4. Вставьте его сюда и нажмите "Войти"{'\n\n'}
              URL выглядит так:{'\n'}
              <Text style={{fontSize: 11, color: '#999'}}>
                https://oauth.vk.com/blank.html#access_token=...
              </Text>
            </Text>
            <TextInput
              style={styles.tokenInput}
              placeholder="Вставьте URL или токен"
              value={tokenInput}
              onChangeText={setTokenInput}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTokenModal(false)}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleTokenSubmit}
              >
                <Text style={styles.modalSubmitText}>Войти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureBullet} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#A78BFA',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
  },
  features: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
    marginRight: 16,
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    fontWeight: '500',
  },
  vkButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: width - 40,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  vkButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: width - 40,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 14,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vkNote: {
    marginTop: 12,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  disclaimer: {
    marginTop: 24,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#4A76A8',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
