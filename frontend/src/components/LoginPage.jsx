// frontend/src/components/LoginPage.jsx

import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    // --- ИЗМЕНЕНИЕ 1 ---
    // Бэкенд ожидает email, поэтому собираем email, а не username.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { loginUser } = useContext(AuthContext);

    const handleSubmit = (e) => {
        // e.preventDefault() остается здесь, в компоненте.
        e.preventDefault();
        // --- ИЗМЕНЕНИЕ 2 ---
        // Вызываем loginUser с объектом, который он теперь ожидает.
        loginUser({ email: email, password: password });
    };

    return (
        <div>
        <form onSubmit={handleSubmit}>
            <h2>Вход в систему</h2>
            <div>
                {/* --- ИЗМЕНЕНИЕ 3 --- */}
                {/* Меняем поля для ввода email */}
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email} // Контролируемый компонент
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введите email"
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Пароль:</label>
                <input
                    type="password"
                    id="password"
                    value={password} // Контролируемый компонент
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                />
            </div>
            <button type="submit">Войти</button>

        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
            Еще нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
        </div>
    );
};

export default LoginPage;