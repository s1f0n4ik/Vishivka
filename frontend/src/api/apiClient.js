// frontend/src/api/apiClient.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Экспортируем константу, чтобы ее можно было использовать в других частях приложения
export const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const apiClient = axios.create({
    baseURL: API_BASE_URL, // Используем нашу константу
});

// "Перехватчик" (interceptor)
apiClient.interceptors.request.use(async req => {
    let authTokens = localStorage.getItem('authTokens')
        ? JSON.parse(localStorage.getItem('authTokens'))
        : null;

    if (!authTokens) {
        return req;
    }

    const user = jwtDecode(authTokens.access);
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

    if (!isExpired) {
        req.headers.Authorization = `Bearer ${authTokens.access}`;
        return req;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/jwt/refresh/`, {
            refresh: authTokens.refresh
        });

        localStorage.setItem('authTokens', JSON.stringify(response.data));
        req.headers.Authorization = `Bearer ${response.data.access}`;
        return req;

    } catch (refreshError) {
        console.error("Не удалось обновить токен! Выходим из системы.", refreshError);
        localStorage.removeItem('authTokens');
        // Вместо window.location.href, чтобы не перезагружать страницу полностью,
        // лучше сделать редирект через роутер, но для простоты пока оставим так.
        window.location.href = '/login';
        return Promise.reject(refreshError);
    }
});

export default apiClient;