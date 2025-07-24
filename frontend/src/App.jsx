    // frontend/src/App.jsx
    import { Routes, Route, Link } from 'react-router-dom';
    import React, { useContext } from 'react'; // Импортируем useContext
    import AuthContext from './context/AuthContext'; // Импортируем наш контекст

    import SchemeList from './components/SchemeList';
    import SchemeDetail from './components/SchemeDetail';
    import SchemeForm from './components/SchemeForm';
    import LoginPage from './components/LoginPage'; // Импортируем страницу логина
    import './App.css';

    function App() {
      // Получаем данные о пользователе и функцию выхода из контекста
      const { user, logoutUser } = useContext(AuthContext);

      return (
        <div>
          <header>
            <Link to="/"><h1>Мир Вышивки</h1></Link>
            <nav>
              {/* Если пользователь вошел, показываем приветствие и кнопку выхода */}
              {user ? (
                <>
                  <span style={{ marginLeft: '20px' }}>Привет, {user.username}!</span>
                  <Link to="/create-scheme" style={{ marginLeft: '20px' }}>Добавить схему</Link>
                  <button onClick={logoutUser} style={{ marginLeft: '20px' }}>Выйти</button>
                </>
              ) : (
                // Если не вошел, показываем ссылку на вход
                <Link to="/login" style={{ marginLeft: '20px' }}>Войти</Link>
              )}
            </nav>
          </header>

          <hr />

          <main>
            <Routes>
              <Route path="/" element={<SchemeList />} />
              <Route path="/schemes/:id" element={<SchemeDetail />} />
              <Route path="/create-scheme" element={<SchemeForm />} />
              <Route path="/login" element={<LoginPage />} /> {/* Добавляем маршрут */}
            </Routes>
          </main>
        </div>
      )
    }

    export default App;