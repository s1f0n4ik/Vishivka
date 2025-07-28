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

import './App.css';

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
    // --- ДОБАВЛЯЕМ ЛОГ ---
    console.log("Layout рендерится с user:", user);
    return (
        <div>
            <header style={{ padding: '10px 20px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1><Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Мир Вышивки</Link></h1>
                <nav>
                    {user ? (
                        <>
                            <Link to={`/profile/${user.username}`} style={{ marginRight: '15px', fontWeight: 'bold' }}>
                                Привет, {user.username || '!'}
                            </Link>
                            <Link to="/my-schemes" style={{ marginLeft: '15px' }}><button>Мои схемы</button></Link>
                            <Link to="/add-scheme" style={{ marginLeft: '15px' }}><button>Добавить схему</button></Link>
                            <button onClick={logoutUser} style={{ marginLeft: '15px' }}>Выйти</button>
                        </>
                    ) : (
                        <Link to="/login"><button>Войти</button></Link>
                    )}
                </nav>
            </header>
            <main style={{ padding: '20px' }}>
                {children}
            </main>
        </div>
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