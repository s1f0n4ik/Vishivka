// frontend/src/axios.js (или как он у вас называется)

import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const baseURL = 'http://127.0.0.1:8000/api/v1';

// Эта функция будет вызываться каждый раз, когда нам нужен будет apiClient
const createApiClient = () => {
    // Сначала получаем токены из localStorage
    let authTokens = localStorage.getItem('authTokens')
        ? JSON.parse(localStorage.getItem('authTokens'))
        : null;

    const apiClient = axios.create({
        baseURL,
        // Мы НЕ указываем Content-Type здесь, чтобы axios мог сам выбирать
        // правильный тип для JSON или для загрузки файлов (multipart/form-data).
    });

    // Создаем "перехватчик" (interceptor), который будет работать ПЕРЕД каждым запросом
    apiClient.interceptors.request.use(async req => {
        // Обновляем токены из localStorage на случай, если они изменились в другой вкладке
        authTokens = localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null;

        if (!authTokens) {
            // Если токенов нет (пользователь не залогинен), отправляем запрос как есть.
            return req;
        }

        // Добавляем токен в заголовок. Сервер будет знать, кто мы.
        req.headers.Authorization = `JWT ${authTokens.access}`;

        // Проверяем, не истек ли срок действия токена
        const user = jwtDecode(authTokens.access);
        const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

        // Если токен не истек, все отлично, просто отправляем запрос
        if (!isExpired) {
            return req;
        }

        // Если токен ИСТЕК, пытаемся его обновить с помощью refresh токена
        try {
            const response = await axios.post(`${baseURL}/auth/jwt/refresh/`, {
                refresh: authTokens.refresh
            });

            // Сохраняем новые токены в localStorage и в заголовке текущего запроса
            localStorage.setItem('authTokens', JSON.stringify(response.data));
            req.headers.Authorization = `JWT ${response.data.access}`;
            return req;

        } catch (refreshError) {
            console.error("Не удалось обновить токен!", refreshError);
            // Тут можно реализовать выход пользователя (logout)
            // например, window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    });

    return apiClient;
};

// Экспортируем результат вызова функции
export default createApiClient();