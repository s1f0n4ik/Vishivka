// frontend/src/components/SchemeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
// Импортируем специальный "создаваемый" селект из библиотеки
import CreatableSelect from 'react-select/creatable';

function SchemeForm() {
    const navigate = useNavigate();
    // Состояния для данных формы
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [schemeFile, setSchemeFile] = useState(null);
    const [error, setError] = useState('');

    // Состояния для категорий
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');

    // === НОВЫЙ КОД ДЛЯ ТЕГОВ ===
    const [allTags, setAllTags] = useState([]); // Список всех доступных тегов с сервера
    const [selectedTags, setSelectedTags] = useState([]); // Теги, выбранные пользователем

    // Загружаем и категории, и теги при первом рендере
    useEffect(() => {
        // Загрузка категорий
        apiClient.get('/categories/')
            .then(response => {
                setCategories(response.data);
                if (response.data.length > 0) {
                    setCategoryId(response.data[0].id);
                }
            })
            .catch(err => console.error("Не удалось загрузить категории", err));

        // Загрузка тегов
        apiClient.get('/tags/')
            .then(response => {
                // Преобразуем теги в формат, который понимает react-select: { value: 'tag_name', label: 'tag_name' }
                const tagOptions = response.data.map(tag => ({ value: tag.name, label: tag.name }));
                setAllTags(tagOptions);
            })
            .catch(err => console.error("Не удалось загрузить теги", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();

        formData.append('title', title);
        formData.append('description', description);

        // Отправляем ID категории, только если он выбран
        if (categoryId) {
            formData.append('category', categoryId);
        }

        // === ИЗМЕНЕНИЕ ЗДЕСЬ ===
        // Превращаем массив выбранных тегов обратно в строку через запятую для бэкенда
        const tagsString = selectedTags.map(tag => tag.value).join(',');
        formData.append('tags_str', tagsString);

        if (previewImage) {
            formData.append('main_image', previewImage);
        }
        // ВАЖНО: ключ для файла соответствует нашему новому сериализатору
        if (schemeFile) {
            formData.append('file_scheme', schemeFile);
        }

        try {
            const response = await apiClient.post('/schemes/', formData);
            navigate(`/schemes/${response.data.id}`);
        } catch (err) {
            console.error('Ошибка при создании схемы:', err.response ? err.response.data : err);
            let errorMessage = 'Не удалось создать схему. Проверьте все поля.';
            if (err.response && err.response.data) {
                // Превращаем объект ошибок в читаемую строку
                const errorData = err.response.data;
                const errorMessages = Object.keys(errorData)
                  .map(key => `${key}: ${errorData[key]}`)
                  .join('; ');
                errorMessage += ` Ошибки сервера: ${errorMessages}`;
            }
            setError(errorMessage);
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
                <option value="">-- не выбрана --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {/* === ЗАМЕНА ПОЛЯ ТЕГОВ === */}
            <div>
              <label>Теги (выберите из списка или начните печатать, чтобы создать новый):</label>
              <CreatableSelect
                isMulti // Позволяет выбирать несколько тегов
                options={allTags} // Список существующих тегов
                value={selectedTags} // Текущие выбранные теги
                onChange={(newValue) => setSelectedTags(newValue)} // Обновляем состояние при изменении
                placeholder="Выберите или создайте теги..."
                formatCreateLabel={userInput => `Создать тег "${userInput}"`}
              />
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