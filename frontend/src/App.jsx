// frontend/src/App.jsx

import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

// --- ИСПРАВЛЕНИЕ №1: ПРАВИЛЬНЫЙ ИМПОРТ ---
// AuthContext импортируется по умолчанию, а AuthProvider - как именованный экспорт.
import AuthContext, { AuthProvider } from './context/AuthContext';

// Импортируем наши реальные компоненты
import SchemeList from './components/SchemeList';
import SchemeDetail from './components/SchemeDetail';
import SchemeForm from './components/SchemeForm';
import SchemeEditForm from './components/SchemeEditForm';
import LoginPage from './components/LoginPage';
import MySchemesPage from './pages/MySchemesPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import FavoritedSchemesPage from './pages/FavoritedSchemesPage';
import UserMenu from './components/UserMenu';

import './App.css';
import logo from './assets/logo.png'

// Этот компонент в полном порядке.
const PrivateRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) {
        return <Navigate to="/login" />;
    }
    return children;
};

function Layout({ children }) {
    const { user, logoutUser } = useContext(AuthContext);
    return (
        <>
            <header className="app-header">
                <div className="container header-content">
                    <Link to="/">
                        <img src={logo} alt="Мир Вышивки - логотип" className="header-logo" />
                    </Link>
                    <nav className="header-nav">
                        {user ? (
                            <>
                                {/* Основные действия для залогиненного пользователя */}
                                <Link to="/favorites" className="nav-link">❤️Избранное❤️</Link>
                                <Link to="/add-scheme" className="nav-button">Добавить схему</Link>

                                {/* Наш новый компонент меню */}
                                <UserMenu user={user} onLogout={logoutUser} />
                            </>
                        ) : (
                            <>
                                {/* Ссылки для гостя */}
                                <Link to="/login" className="nav-link">Войти</Link>
                                <Link to="/register" className="nav-button">Регистрация</Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            {/* Оборачиваем основной контент в .container для центрирования */}
            <main className="container" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
                {children}
            </main>
        </>
    );
}


function App() {
  // Убираем лишнюю проверку `if (loading)`, так как AuthProvider теперь делает это за нас.
  // Убираем лишнее получение user и logoutUser, так как они нужны только в Layout.
  const { loading } = useContext(AuthContext); // Можно даже эту строку убрать, но оставим для ясности

  console.log("App рендерится с loading:", loading);

  return (
    <Layout>
        <Routes>
            {/* Публичные роуты */}
            <Route path="/" element={<SchemeList />} />
            <Route path="/schemes/:id" element={<SchemeDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />

            {/* Приватные роуты, обернутые в PrivateRoute */}
            <Route path="/add-scheme" element={<PrivateRoute><SchemeForm /></PrivateRoute>} />
            <Route path="/schemes/:id/edit" element={<PrivateRoute><SchemeEditForm /></PrivateRoute>} />
            <Route path="/my-schemes" element={<PrivateRoute><MySchemesPage /></PrivateRoute>} />
            <Route path="/favorites" element={<PrivateRoute><FavoritedSchemesPage /></PrivateRoute>} />
        </Routes>
    </Layout>
  );
}


export default function AppWrapper() {
    return (
        <Router>
            <AuthProvider>
                <App />
            </AuthProvider>
        </Router>
    );
}