// frontend/src/pages/RegisterPage.jsx

import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthContext from '../context/AuthContext';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState(''); // Поле для подтверждения пароля
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Мы используем AuthContext, чтобы проверить, не залогинен ли уже пользователь
    const { user } = useContext(AuthContext);

    // Если пользователь уже вошел, перенаправляем его на главную
    if (user) {
        navigate('/');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Простая проверка на совпадение паролей на фронте
        if (password !== password2) {
            setError('Пароли не совпадают.');
            return;
        }

        try {
            // Djoser ожидает username, email и password
            await apiClient.post('/auth/users/', {
                username,
                email,
                password,
                re_password: password2
            });
            // После успешной регистрации перенаправляем на страницу входа
            alert('Регистрация прошла успешно! Теперь вы можете войти.');
            navigate('/login');
        } catch (err) {
            console.error('Ошибка при регистрации:', err.response ? err.response.data : err);
            let errorMessage = 'Не удалось зарегистрироваться.';
            // Djoser возвращает подробные ошибки
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                const errorMessages = Object.keys(errorData)
                  .map(key => `${key}: ${errorData[key].join(' ')}`)
                  .join('; ');
                errorMessage += ` Ошибки: ${errorMessages}`;
            }
            setError(errorMessage);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div style={{ marginBottom: '10px' }}>
                    <label>Имя пользователя:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                 <div style={{ marginBottom: '15px' }}>
                    <label>Подтвердите пароль:</label>
                    <input
                        type="password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px' }}>Зарегистрироваться</button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
    );
}

export default RegisterPage;