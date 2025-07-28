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
        <div className="login-container">
            <h2>Вход в аккаунт</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="form-button">Войти</button>
            </form>
            <p className="register-link">
                Еще нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
            </p>
        </div>
    );
};

export default LoginPage;