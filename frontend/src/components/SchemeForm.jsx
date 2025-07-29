// frontend/src/components/SchemeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';

// Функция для кастомного отображения опции с описанием
const formatOptionLabel = ({ label, description }) => (
    <div style={{ lineHeight: '1.4' }}>
      <div>{label}</div>
      {description && (
        <small style={{ color: 'var(--text-secondary)' }}>
          {description}
        </small>
      )}
    </div>
);


function SchemeForm() {
    const navigate = useNavigate();
    // Состояния для данных формы
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [schemeFile, setSchemeFile] = useState(null);
    const [error, setError] = useState('');

    const [galleryImages, setGalleryImages] = useState([]);

    // --- ИЗМЕНЕНИЕ 1: Разделим состояния загрузки ---
    const [isSubmitting, setIsSubmitting] = useState(false); // Для отправки формы
    const [isFetching, setIsFetching] = useState(true);      // Для начальной загрузки данных

    // Состояния для загружаемых данных
    const [allLicenses, setAllLicenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);

    // Состояния для выбранных значений
    const [licenseId, setLicenseId] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    useEffect(() => {
        setIsFetching(true);
        // --- ИЗМЕНЕНИЕ 2: Используем Promise.all для параллельной загрузки ---
        Promise.all([
            apiClient.get('/licenses/'),
            apiClient.get('/categories/'),
            apiClient.get('/tags/')
        ]).then(([licensesResponse, categoriesResponse, tagsResponse]) => {
            // --- ИЗМЕНЕНИЕ 3: Правильно извлекаем данные из "results" ---
            const licenses = licensesResponse.data.results || licensesResponse.data;
            setAllLicenses(licenses);
            if (licenses.length > 0) {
                setLicenseId(licenses[0].id);
            }

            const categories = categoriesResponse.data.results || categoriesResponse.data;
            setCategories(categories);

            const tags = tagsResponse.data.results || tagsResponse.data;
            const tagOptions = tags.map(tag => ({ value: tag.name, label: tag.name }));
            setAllTags(tagOptions);

        }).catch(err => {
            console.error("Не удалось загрузить начальные данные", err);
            setError("Ошибка загрузки данных для формы. Попробуйте обновить страницу.");
        }).finally(() => {
            setIsFetching(false);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', categoryId);
        formData.append('license', licenseId);

        const tagsString = selectedTags.map(tag => tag.value).join(',');
        formData.append('tags_str', tagsString);

        if (previewImage) formData.append('main_image', previewImage);
        if (schemeFile) formData.append('file_scheme', schemeFile);

        if (galleryImages.length > 0) {
            galleryImages.forEach(file => {
                // Ключ 'gallery_images' должен совпадать с ключом в сериализаторе
                formData.append('gallery_images', file);
            });
        }

        try {
            const response = await apiClient.post('/schemes/', formData);
            navigate(`/schemes/${response.data.id}`);
        } catch (err) {
            console.error('Ошибка при создании схемы:', err.response ? err.response.data : err);
            const errorMessage = 'Не удалось создать схему. Проверьте правильность заполнения всех полей.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ИЗМЕНЕНИЕ 4: Добавляем состояние загрузки ---
    if (isFetching) {
        return <div className="form-container"><h2>Загрузка данных...</h2></div>;
    }

    const handleGalleryImageChange = (e) => {
        // e.target.files это FileList, преобразуем его в массив
        setGalleryImages(Array.from(e.target.files));
    };

    const licenseOptions = allLicenses.map(l => ({
        value: l.id,
        label: l.name,
        description: l.description
    }));

    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <h2>Добавить новую схему</h2>
                {error && <p className="form-error">{error}</p>}

                {/* ... остальная JSX разметка остается без изменений ... */}

                <div className="form-group">
                    <label htmlFor="title">Название схемы</label>
                    <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Описание</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="5" />
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="category">Категория</label>
                        <Select
                            id="category"
                            options={categoryOptions}
                            onChange={option => setCategoryId(option.value)}
                            placeholder="Выберите категорию..."
                            className="react-select-container"
                            classNamePrefix="react-select"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="license">Лицензия</label>
                        <Select
                            id="license"
                            value={licenseOptions.find(opt => opt.value === licenseId)}
                            options={licenseOptions}
                            onChange={option => setLicenseId(option.value)}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            formatOptionLabel={formatOptionLabel}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="tags">Теги</label>
                    <CreatableSelect
                        id="tags" isMulti options={allTags} value={selectedTags}
                        onChange={setSelectedTags} placeholder="Выберите или создайте теги..."
                        formatCreateLabel={userInput => `Создать тег "${userInput}"`}
                        className="react-select-container" classNamePrefix="react-select"
                    />
                </div>
                <div className="form-grid">
                <div className="form-group">
                    <label htmlFor="previewImage">Изображение-превью</label>
                    <div className="custom-file-input">
                        <label htmlFor="previewImage" className="file-input-label">
                            Выберите файл
                        </label>
                        <span className="file-input-name">
                            {previewImage ? previewImage.name : 'Файл не выбран'}
                        </span>
                        <input id="previewImage" type="file" accept="image/*"
                               onChange={e => setPreviewImage(e.target.files[0])} required />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="galleryImages">Дополнительные изображения (галерея)</label>
                    <div className="custom-file-input">
                        <label htmlFor="galleryImages" className="file-input-label">
                            Выберите файлы
                        </label>
                        <span className="file-input-name">
                            {galleryImages.length > 0
                                ? `Выбрано файлов: ${galleryImages.length}`
                                : 'Файлы не выбраны'}
                        </span>
                        <input
                            id="galleryImages"
                            type="file"
                            accept="image/*"
                            multiple // <--- Важный атрибут!
                            onChange={handleGalleryImageChange}
                        />
                    </div>
                    {galleryImages.length > 0 && (
                        <ul className="file-preview-list">
                            {galleryImages.map((file, index) => (
                                <li key={index}>{file.name}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="schemeFile">Файл схемы (.pdf, .zip и т.д.)</label>
                     <div className="custom-file-input">
                        <label htmlFor="schemeFile" className="file-input-label">
                            Выберите файл
                        </label>
                        <span className="file-input-name">
                            {schemeFile ? schemeFile.name : 'Файл не выбран'}
                        </span>
                        <input id="schemeFile" type="file"
                               onChange={e => setSchemeFile(e.target.files[0])} required />
                    </div>
                </div>
            </div>
                <button type="submit" disabled={isSubmitting} className="form-button">
                    {isSubmitting ? 'Создание...' : 'Создать схему'}
                </button>
            </form>
        </div>
    );
}

export default SchemeForm;