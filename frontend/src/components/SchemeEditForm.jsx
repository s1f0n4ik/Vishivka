// frontend/src/components/SchemeEditForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';

// Копируем кастомную функцию рендера опций
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

function SchemeEditForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Состояния для данных
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [schemeFile, setSchemeFile] = useState(null);
    const [error, setError] = useState('');
    const [isFetching, setIsFetching] = useState(true);

    // Состояния для селектов
    const [allLicenses, setAllLicenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);

    const [licenseId, setLicenseId] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    useEffect(() => {
        setIsFetching(true);
        // Загружаем всё параллельно: справочники и данные самой схемы
        Promise.all([
            apiClient.get(`/schemes/${id}/`),
            apiClient.get('/licenses/'),
            apiClient.get('/categories/'),
            apiClient.get('/tags/')
        ]).then(([schemeResponse, licensesResponse, categoriesResponse, tagsResponse]) => {
            const schemeData = schemeResponse.data;
            const licenses = licensesResponse.data.results || licensesResponse.data;
            const categories = categoriesResponse.data.results || categoriesResponse.data;
            const tags = tagsResponse.data.results || tagsResponse.data;

            // Заполняем справочники
            setAllLicenses(licenses);
            setCategories(categories);
            setAllTags(tags.map(tag => ({ value: tag.name, label: tag.name })));

            // Заполняем форму данными схемы
            setTitle(schemeData.title);
            setDescription(schemeData.description);
            setCategoryId(schemeData.category?.id || '');
            setLicenseId(schemeData.license?.id || null);
            setSelectedTags(schemeData.tags.map(tag => ({ value: tag.name, label: tag.name })));

        }).catch(err => {
            console.error("Не удалось загрузить данные для редактирования", err);
            setError("Ошибка загрузки данных. Попробуйте обновить страницу.");
        }).finally(() => {
            setIsFetching(false);
        });
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (categoryId) formData.append('category', categoryId);
        if (licenseId) formData.append('license', licenseId); // Отправляем ID лицензии

        const tagsString = selectedTags.map(tag => tag.value).join(',');
        formData.append('tags_str', tagsString);

        if (previewImage) formData.append('main_image', previewImage);
        if (schemeFile) formData.append('file_scheme', schemeFile);

        try {
            // Используем PATCH для частичного обновления, это более правильно
            const response = await apiClient.patch(`/schemes/${id}/`, formData);
            navigate(`/schemes/${response.data.id}`);
        } catch (err) {
            console.error('Ошибка при обновлении схемы:', err.response ? err.response.data : err);
            setError('Не удалось обновить схему. Проверьте все поля.');
        }
    };

    if (isFetching) {
        return <div className="form-container"><h2>Загрузка данных...</h2></div>;
    }

    const licenseOptions = allLicenses.map(l => ({
        value: l.id,
        label: l.name,
        description: l.description
    }));

    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <h2>Редактирование схемы</h2>
                {error && <p className="form-error">{error}</p>}
                {/* JSX здесь копирует структуру из SchemeForm для консистентности */}
                <div className="form-group">
                    <label htmlFor="title">Название схемы</label>
                    <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                {/* ... и так далее для всех полей ... */}
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
                {/* ... остальные поля ... */}
                <button type="submit">Сохранить изменения</button>
            </form>
        </div>
    );
}

export default SchemeEditForm;