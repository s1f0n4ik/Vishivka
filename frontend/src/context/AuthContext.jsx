// frontend/src/context/AuthContext.jsx
import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    const [user, setUser] = useState(() =>
        localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) : null
    );

    const navigate = useNavigate();

    const loginUser = async (username, password) => {
        try {
            const response = await apiClient.post('/auth/jwt/create/', {
                email: username,
                password: password
            });

            if (response.status === 200) {
                const data = response.data;
                // 1. Сохраняем токены в localStorage
                localStorage.setItem('authTokens', JSON.stringify(data));
                // 2. Обновляем состояние React, чтобы интерфейс изменился
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                // 3. Перенаправляем пользователя
                navigate('/');
            }
        } catch (error) {
            console.error("Ошибка входа:", error.response ? error.response.data : error);
            alert('Неверный логин или пароль.');
        }
    };

    const logoutUser = () => {
        // 1. Чистим localStorage
        localStorage.removeItem('authTokens');
        // 2. Обновляем состояние React
        setAuthTokens(null);
        setUser(null);
        // 3. Перенаправляем пользователя
        navigate('/login');
    };

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