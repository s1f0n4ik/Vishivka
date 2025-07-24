    import React, { useState, useEffect } from 'react';
    import { useParams } from 'react-router-dom'; // Хук для получения параметров из URL
    import apiClient from '../api/axios';

    function SchemeDetail() {
      const { id } = useParams(); // Получаем 'id' из URL (например, из /schemes/1)
      const [scheme, setScheme] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      useEffect(() => {
        const fetchScheme = async () => {
          try {
            // Делаем запрос к эндпоинту для конкретной схемы
            const response = await apiClient.get(`/schemes/${id}/`);
            setScheme(response.data);
          } catch (err) {
            setError(err);
          } finally {
            setLoading(false);
          }
        };

        fetchScheme();
      }, [id]); // Эффект перезапустится, если id в URL изменится

      if (loading) return <p>Загрузка схемы...</p>;
      if (error) return <p>Ошибка при загрузке схемы.</p>;
      if (!scheme) return <p>Схема не найдена.</p>;

      // Формируем полный URL для превью
      const previewUrl = `${scheme.main_image}`;

      return (
        <div>
          <h2>{scheme.title}</h2>
          <img src={previewUrl} alt={`Превью для ${scheme.title}`} style={{ maxWidth: '400px', height: 'auto' }} />
          <p><strong>Автор:</strong> {scheme.author.username} ({scheme.author.email})</p>
          <p><strong>Категория:</strong> {scheme.category.name}</p>
          <p><strong>Описание:</strong> {scheme.description || 'Описание отсутствует.'}</p>
          <p><strong>Теги:</strong> {scheme.tags.map(tag => tag.name).join(', ')}</p>
          <p><strong>Просмотры:</strong> {scheme.views_count}</p>
          {/* В будущем здесь будет ссылка на скачивание файла */}
        </div>
      );
    }

    export default SchemeDetail;