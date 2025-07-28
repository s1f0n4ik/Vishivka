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

// Этот компонент тоже в полном порядке.
function Layout({ children }) {
    const { user, logoutUser } = useContext(AuthContext);
    return (
        <div>
            <header style={{ padding: '10px 20px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1><Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Мир Вышивки</Link></h1>
                <nav>
                    {user ? (
                        <>
                            <span>Привет, {user.username || '!'}</span>
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
  // --- ИСПРАВЛЕНИЕ №2: УБИРАЕМ ДУБЛИРУЮЩИЙ <AuthProvider> ---
  // Он уже есть в main.jsx, поэтому здесь он не нужен.
  // Также убираем лишний <Router>, так как он тоже есть в main.jsx
  return (
    <Layout>
        <Routes>
            {/* Публичные роуты */}
            <Route path="/" element={<SchemeList />} />
            <Route path="/schemes/:id" element={<SchemeDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

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