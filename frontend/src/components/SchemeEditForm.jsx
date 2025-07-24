// frontend/src/components/SchemeEditForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import CreatableSelect from 'react-select/creatable';

function SchemeEditForm() {
    const { id } = useParams(); // Получаем ID из URL
    const navigate = useNavigate();

    // Состояния для данных формы (пустые по умолчанию)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    // Для файлов мы не будем показывать старые, пользователь может загрузить новые
    const [previewImage, setPreviewImage] = useState(null);
    const [schemeFile, setSchemeFile] = useState(null);
    const [error, setError] = useState('');

    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');

    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    // Эффект для загрузки данных СХЕМЫ и справочников (категории, теги)
    useEffect(() => {
        // Загрузка категорий и тегов (как в старой форме)
        apiClient.get('/categories/').then(res => setCategories(res.data));
        apiClient.get('/tags/').then(res => {
            const tagOptions = res.data.map(tag => ({ value: tag.name, label: tag.name }));
            setAllTags(tagOptions);
        });

        // Загрузка данных редактируемой схемы
        apiClient.get(`/schemes/${id}/`)
            .then(response => {
                const schemeData = response.data;
                // Заполняем состояния данными с сервера
                setTitle(schemeData.title);
                setDescription(schemeData.description);
                setCategoryId(schemeData.category?.id || ''); // Используем ?. для безопасности
                // Преобразуем теги из формата {name: '...'} в формат react-select {value: '...', label: '...'}
                const currentTags = schemeData.tags.map(tag => ({ value: tag.name, label: tag.name }));
                setSelectedTags(currentTags);
            })
            .catch(err => {
                console.error("Не удалось загрузить данные схемы", err);
                setError("Не удалось загрузить данные для редактирования.");
            });
    }, [id]); // Эффект зависит от ID в URL

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (categoryId) {
            formData.append('category', categoryId);
        }
        const tagsString = selectedTags.map(tag => tag.value).join(',');
        formData.append('tags_str', tagsString);

        // ВАЖНО: отправляем файлы, только если пользователь выбрал новые
        if (previewImage) {
            formData.append('main_image', previewImage);
        }
        if (schemeFile) {
            formData.append('file_scheme', schemeFile);
        }

        try {
            // ИСПОЛЬЗУЕМ PUT ВМЕСТО POST!
            const response = await apiClient.put(`/schemes/${id}/`, formData);
            // Переходим на страницу просмотра после успешного редактирования
            navigate(`/schemes/${response.data.id}`);
        } catch (err) {
            // ... (обработка ошибок остается такой же) ...
            console.error('Ошибка при обновлении схемы:', err.response ? err.response.data : err);
            let errorMessage = 'Не удалось обновить схему. Проверьте все поля.';
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                const errorMessages = Object.keys(errorData).map(key => `${key}: ${errorData[key]}`).join('; ');
                errorMessage += ` Ошибки сервера: ${errorMessages}`;
            }
            setError(errorMessage);
        }
    };

    return (
        // JSX разметка формы остается почти такой же, как в SchemeForm,
        // но заголовок и кнопка другие.
        <form onSubmit={handleSubmit}>
            <h2>Редактирование схемы</h2>
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
                <option value="">-- не выбрана --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Теги:</label>
              <CreatableSelect
                isMulti
                options={allTags}
                value={selectedTags}
                onChange={(newValue) => setSelectedTags(newValue)}
              />
            </div>
            <div>
              <label>Заменить изображение-превью (необязательно):</label>
              <input type="file" onChange={e => setPreviewImage(e.target.files[0])} />
            </div>
            <div>
              <label>Заменить файл схемы (необязательно):</label>
              <input type="file" onChange={e => setSchemeFile(e.target.files[0])} />
            </div>
            <button type="submit">Сохранить изменения</button>
        </form>
    );
}

export default SchemeEditForm;