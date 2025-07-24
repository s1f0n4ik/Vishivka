    import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import apiClient from '../api/axios';

    function SchemeForm() {
      const navigate = useNavigate(); // Хук для перенаправления пользователя
      const [categories, setCategories] = useState([]);

      // Состояния для каждого поля формы
      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      const [categoryId, setCategoryId] = useState('');
      const [tags, setTags] = useState('');
      const [previewImage, setPreviewImage] = useState(null);
      const [schemeFile, setSchemeFile] = useState(null);

      const [error, setError] = useState('');

      // Загружаем категории для выпадающего списка
      useEffect(() => {
        apiClient.get('/categories/')
          .then(response => {
            setCategories(response.data);
            if (response.data.length > 0) {
              setCategoryId(response.data[0].id); // Выбираем первую категорию по умолчанию
            }
          })
          .catch(err => console.error("Не удалось загрузить категории", err));
      }, []);

      const handleSubmit = async (e) => {
        e.preventDefault(); // Предотвращаем стандартную отправку формы
        setError('');

        // Для отправки файлов используется специальный объект FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', categoryId);
        // Теги отправляем как строку, бэкенд их распарсит
        formData.append('tags_str', tags);

        // Добавляем файлы, только если они выбраны
        if (previewImage) formData.append('main_image', previewImage);
        if (schemeFile) formData.append('file', schemeFile);

        try {
          // Отправляем POST-запрос с FormData
          // Axios сам подставит нужный заголовок 'multipart/form-data'
          const response = await apiClient.post('/schemes/', formData);
          // После успешного создания перенаправляем на страницу новой схемы
          navigate(`/schemes/${response.data.id}`);
        } catch (err) {
          console.error('Ошибка при создании схемы:', err.response.data);
          setError('Не удалось создать схему. Проверьте все поля.');
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <h2>Добавить новую схему</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div>
            <label>Название:</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label>Описание:</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label>Категория:</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Теги (через запятую):</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div>
            <label>Изображение-превью:</label>
            <input type="file" onChange={e => setPreviewImage(e.target.files[0])} required />
          </div>
          <div>
            <label>Файл схемы (.pdf, .zip, и т.д.):</label>
            <input type="file" onChange={e => setSchemeFile(e.target.files[0])} required />
          </div>

          <button type="submit">Создать схему</button>
        </form>
      );
    }

    export default SchemeForm;