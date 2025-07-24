    import React, { useState, useEffect } from 'react';
    import apiClient from '../api/axios';
    import { Link } from 'react-router-dom';

    function SchemeList() {
      // Состояние для хранения списка схем
      const [schemes, setSchemes] = useState([]);
      // Состояние для отслеживания загрузки
      const [loading, setLoading] = useState(true);
      // Состояние для хранения ошибки
      const [error, setError] = useState(null);

      // useEffect будет выполняться один раз после первого рендера компонента
      useEffect(() => {
        // Определяем асинхронную функцию для получения данных
        const fetchSchemes = async () => {
          try {
            // Отправляем GET-запрос на эндпоинт '/schemes/'
            const response = await apiClient.get('/schemes/');
            // Сохраняем полученные данные в состояние
            setSchemes(response.data); // У DRF данные обычно в response.data.results
          } catch (err) {
            // Если произошла ошибка, сохраняем ее
            setError(err);
          } finally {
            // В любом случае (успех или ошибка) убираем индикатор загрузки
            setLoading(false);
          }
        };

        fetchSchemes(); // Вызываем функцию
      }, []); // Пустой массив зависимостей означает, что эффект выполнится только один раз

      // Отображаем разные вещи в зависимости от состояния
      if (loading) {
        return <p>Загрузка схем...</p>;
      }

      if (error) {
        // Важно! На этом этапе ты, скорее всего, увидишь ошибку CORS. Это нормально, мы исправим ее дальше.
        console.error("Ошибка CORS или другая сетевая ошибка:", error);
        return <p>Ошибка при загрузке данных. Откройте консоль разработчика (F12) для подробностей.</p>;
      }

      return (
        <div>
          <h2>Список схем</h2>
          {schemes.length > 0 ? (
            <ul>
              {schemes.map(scheme => (
                <li key={scheme.id}>
                  {/* 2. Оборачиваем заголовок в Link */}
                  <h3>
                    <Link to={`/schemes/${scheme.id}`}>
                      {scheme.title}
                    </Link>
                  </h3>
                  {/* Мы используем scheme.author.username, так как наш ListSerializer тоже вложенный */}
                  <p>Автор: {scheme.author.username}</p>
                  <p>Категория: {scheme.category.name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>Схем пока нет.</p>
          )}
        </div>
      );
    }

    export default SchemeList;