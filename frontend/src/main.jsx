    // frontend/src/main.jsx
    import React from 'react'
    import ReactDOM from 'react-dom/client'
    import App from './App.jsx'
    import { BrowserRouter } from 'react-router-dom';
    import { AuthProvider } from './context/AuthContext'; // 1. Импортируем наш провайдер

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider> {/* 2. Оборачиваем App */}
            <App />
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>,
    )