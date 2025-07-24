// frontend/src/api/apiClient.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const baseURL = 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
    baseURL,
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
        // ----- ГЛАВНОЕ И ОКОНЧАТЕЛЬНОЕ ИСПРАВЛЕНИЕ -----
        // Используем префикс 'Bearer', а не 'JWT'.
        req.headers.Authorization = `Bearer ${authTokens.access}`;
        // --------------------------------------------------
        return req;
    }

    try {
        const response = await axios.post(`${baseURL}/auth/jwt/refresh/`, {
            refresh: authTokens.refresh
        });

        localStorage.setItem('authTokens', JSON.stringify(response.data));

        // ----- И здесь тоже исправляем на 'Bearer' -----
        req.headers.Authorization = `Bearer ${response.data.access}`;
        // ---------------------------------------------
        return req;

    } catch (refreshError) {
        console.error("Не удалось обновить токен! Выходим из системы.", refreshError);
        localStorage.removeItem('authTokens');
        window.location.href = '/login';
        return Promise.reject(refreshError);
    }
});

export default apiClient;