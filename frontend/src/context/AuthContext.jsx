// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    // --- ИЗМЕНЕНИЕ 1 ---
    // Начальное состояние user ВСЕГДА null. Мы получим его через API.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const loginUser = async ({ email, password }) => {
        try {
            const response = await apiClient.post('/auth/jwt/create/', {
                email: email,
                password: password,
            });
            const data = response.data;
            // Сначала устанавливаем токены. Это вызовет useEffect,
            // который загрузит данные пользователя.
            setAuthTokens(data);
            localStorage.setItem('authTokens', JSON.stringify(data));
            navigate('/');
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert('Что-то пошло не так при входе! Проверьте email и пароль.');
        }
    };

    const logoutUser = () => {
        console.log("LOGOUT: Стираем данные пользователя.");
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    };

    // --- ИЗМЕНЕНИЕ 2: ГЛАВНАЯ ЛОГИКА ---
    // Этот useEffect будет срабатывать при изменении токенов
    // и загружать актуальные данные пользователя.
    useEffect(() => {
        const fetchUserData = async () => {
            if (authTokens) {
                console.log("useEffect [authTokens]: Токены есть, запрашиваю данные пользователя с /auth/users/me/");
                try {
                    // apiClient автоматически подставит заголовок авторизации
                    const response = await apiClient.get('/auth/users/me/');
                    setUser(response.data);
                    console.log("useEffect [authTokens]: Данные пользователя успешно получены:", response.data);
                } catch (error) {
                    console.error("useEffect [authTokens]: Не удалось получить данные пользователя, разлогиниваемся.", error);
                    // Если токен есть, но он невалидный, выходим из системы
                    logoutUser();
                }
            }
            // Вне зависимости от результата, завершаем общую загрузку
             setLoading(false);
        };

        fetchUserData();

    }, [authTokens]); // Зависимость от authTokens - это ключ!

    const contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
        // loading больше не передаем, он нужен только внутри провайдера
    };

    // --- ИЗМЕНЕНИЕ 3 ---
    // Пока идет начальная загрузка (проверка токена и получение user),
    // мы ничего не рендерим или показываем заглушку.
    // Когда loading станет false, user будет либо null, либо объектом.
    return (
        <AuthContext.Provider value={contextData}>
            {loading ? <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</p> : children}
        </AuthContext.Provider>
    );
};