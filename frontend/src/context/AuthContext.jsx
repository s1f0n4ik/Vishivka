    // frontend/src/context/AuthContext.jsx
    import React, { createContext, useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { jwtDecode } from 'jwt-decode';
    import apiClient from '../api/axios';

    const AuthContext = createContext();

    export default AuthContext;

    export const AuthProvider = ({ children }) => {
        // Пробуем достать токены из localStorage при загрузке приложения
        const [authTokens, setAuthTokens] = useState(() =>
            localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
        );
        // Если токены есть, декодируем их и получаем информацию о пользователе
        const [user, setUser] = useState(() =>
            localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) : null
        );

        const navigate = useNavigate();

        // Функция для входа пользователя
        const loginUser = async (username, password) => {
            try {
                const response = await apiClient.post('/auth/jwt/create/', {
                    email: username ,
                    password: password
                });

                if (response.status === 200) {
                    const data = response.data;
                    setAuthTokens(data);
                    setUser(jwtDecode(data.access));
                    // Сохраняем токены в localStorage, чтобы они не пропадали при перезагрузке
                    localStorage.setItem('authTokens', JSON.stringify(data));
                    navigate('/'); // Перенаправляем на главную после успешного входа
                }
            } catch (error) {
                console.error("Ошибка входа:", error);
                alert('Неверное имя пользователя или пароль!');
            }
        };

        // Функция для выхода
        const logoutUser = () => {
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem('authTokens');
            navigate('/login'); // Перенаправляем на страницу входа
        };

        // Передаем все нужные данные и функции в контекст
        const contextData = {
            user,
            authTokens,
            loginUser,
            logoutUser,
        };

        return (
            <AuthContext.Provider value={contextData}>
                {children}
            </AuthContext.Provider>
        );
    };