// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
// Мы импортируем AppWrapper, который теперь называется export default из App.jsx
import AppWrapper from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Теперь здесь только один компонент, который содержит всю логику внутри себя */}
    <AppWrapper />
  </React.StrictMode>,
)