    // frontend/src/utils/axiosInstance.js

    import axios from 'axios';
    import { jwtDecode } from 'jwt-decode';
    import dayjs from 'dayjs';

    const baseURL = 'http://127.0.0.1:8000/api/v1';

    // Получаем токены из localStorage
    let authTokens = localStorage.getItem('authTokens')
        ? JSON.parse(localStorage.getItem('authTokens'))
        : null;

    const axiosInstance = axios.create({
        baseURL,
        // Добавляем заголовок с токеном, если он есть
        headers: { Authorization: `JWT ${authTokens?.access}` }
    });

    // Это "перехватчик" (interceptor). Он будет срабатывать ПЕРЕД каждым запросом.
    axiosInstance.interceptors.request.use(async req => {
        // Обновляем токены из localStorage на случай, если они изменились
        authTokens = localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null;

        if (!authTokens) {
            // Если токенов нет, просто отправляем запрос как есть (для публичных страниц)
            req.headers.Authorization = null;
            return req;
        }

        // Проверяем, не истек ли access токен
        const user = jwtDecode(authTokens.access);
        const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

        if (!isExpired) {
            // Если токен не истек, добавляем его в заголовок и отправляем запрос
            req.headers.Authorization = `JWT ${authTokens.access}`;
            return req;
        }

        // Если access токен ИСТЕК, пытаемся его обновить
        const response = await axios.post(`${baseURL}/auth/jwt/refresh/`, {
            refresh: authTokens.refresh
        });

        // Сохраняем новые токены
        localStorage.setItem('authTokens', JSON.stringify(response.data));
        authTokens = response.data; // Обновляем переменную для текущего запроса

        // Добавляем новый access токен в заголовок и отправляем запрос
        req.headers.Authorization = `JWT ${response.data.access}`;
        return req;
    });

    export default axiosInstance;