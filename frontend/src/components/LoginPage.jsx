    // frontend/src/components/LoginPage.jsx
    import React, { useState, useContext } from 'react';
    import AuthContext from '../context/AuthContext';
    import { useNavigate, Link } from 'react-router-dom';

    const LoginPage = () => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        // Получаем функцию loginUser из нашего контекста
        const { loginUser } = useContext(AuthContext);

        const handleSubmit = (e) => {
            e.preventDefault();
            loginUser(username, password);
        };

        return (
            <div>
            <form onSubmit={handleSubmit}>
                <h2>Вход в систему</h2>
                <div>
                    <label htmlFor="username">Имя пользователя:</label>
                    <input
                        type="text"
                        id="username"
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Введите имя пользователя"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
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