        import axios from 'axios';

        // Создаем экземпляр axios с предопределенными настройками
        const apiClient = axios.create({
          // Указываем базовый URL нашего Django API
          // Важно! Убедись, что твой Django-сервер запущен на порту 8000.
          baseURL: 'http://127.0.0.1:8000/api/v1/',
          // Устанавливаем заголовки, чтобы сервер знал, что мы ожидаем JSON
          headers: {
            'Content-Type': 'application/json'
          }
        });

        export default apiClient;