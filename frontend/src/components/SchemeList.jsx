// frontend/src/components/SchemeList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

// --- ИЗМЕНЕНИЕ 1: Добавляем новый пропс onResetFilters ---
function FilterPanel({ onFilterChange, onResetFilters, categories, licenses, allTags }) {
    const [searchParams] = useSearchParams();

    // Опции селектов
    const categoryOptions = [{ value: '', label: 'Все категории' }, ...categories.map(c => ({ value: c.id, label: c.name }))];
    const licenseOptions = [{ value: '', label: 'Все лицензии' }, ...licenses.map(l => ({ value: l.id, label: l.name }))];
    // Обновляем опции, чтобы они точно соответствовали значениям в URL и бэкенде
    const difficultyOptions = [
        { value: '', label: 'Любая сложность' },
        { value: 'easy', label: 'Лёгкая' },
        { value: 'medium', label: 'Средняя' },
        { value: 'hard', label: 'Сложная' },
        { value: 'expert', label: 'Эксперт' },
    ];


    // Состояния для полей формы
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(categoryOptions[0]);
    const [selectedLicense, setSelectedLicense] = useState(licenseOptions[0]);
    const [selectedDifficulty, setSelectedDifficulty] = useState(difficultyOptions[0]);

    // Эффект для синхронизации формы с URL
    useEffect(() => {
        // Синхронизируем категории
        const categoryFromUrl = searchParams.get('category');
        const foundCategory = categoryOptions.find(o => String(o.value) === categoryFromUrl) || categoryOptions[0];
        setSelectedCategory(foundCategory);

        // Синхронизируем лицензии
        const licenseFromUrl = searchParams.get('license');
        const foundLicense = licenseOptions.find(o => String(o.value) === licenseFromUrl) || licenseOptions[0];
        setSelectedLicense(foundLicense);

        // Синхронизируем остальные поля
        setSearchTerm(searchParams.get('search') || '');
        const tagsFromUrl = searchParams.get('tags');
        setSelectedTags(tagsFromUrl ? tagsFromUrl.split(',').map(tag => ({ value: tag, label: tag })) : []);
        const difficultyFromUrl = searchParams.get('difficulty');
        setSelectedDifficulty(difficultyOptions.find(o => o.value === difficultyFromUrl) || difficultyOptions[0]);

    }, [searchParams, categories, licenses]);


    const handleFilterSubmit = (e) => {
        e.preventDefault();
        onFilterChange({
            search: searchTerm,
            category: selectedCategory.value,
            difficulty: selectedDifficulty.value,
            license: selectedLicense.value,
            tags: selectedTags.map(tag => tag.value).join(',')
        });
    };

    // --- ИЗМЕНЕНИЕ 2: Обработчик для кнопки сброса ---
    const handleResetClick = () => {
        // Просто вызываем функцию, переданную из родителя
        onResetFilters();
    };

    return (
        // --- ИЗМЕНЕНИЕ 3: Меняем тег form на div, так как у нас теперь две кнопки с разным поведением ---
        <div className="filter-panel">
            <div className="filter-group">
                <label>Поиск</label>
                <input type="text" placeholder="По названию..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-search" />
            </div>
            <div className="filter-group">
                <label>Категория</label>
                <Select options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} className="react-select-container" classNamePrefix="react-select"/>
            </div>
             <div className="filter-group">
                <label>Сложность</label>
                <Select options={difficultyOptions} value={selectedDifficulty} onChange={setSelectedDifficulty} className="react-select-container" classNamePrefix="react-select"/>
            </div>
            <div className="filter-group">
                <label>Лицензия</label>
                <Select options={licenseOptions} value={selectedLicense} onChange={setSelectedLicense} className="react-select-container" classNamePrefix="react-select"/>
            </div>
            <div className="filter-group">
                <label>Теги</label>
                <CreatableSelect isMulti options={allTags} value={selectedTags} onChange={setSelectedTags} placeholder="Выберите теги..." formatCreateLabel={userInput => `Искать по тегу "${userInput}"`} className="react-select-container" classNamePrefix="react-select"/>
            </div>
            {/* --- ИЗМЕНЕНИЕ 4: Добавляем кнопки --- */}
            <div className="filter-buttons">
                <button type="button" className="button" onClick={handleFilterSubmit}>Применить</button>
                <button type="button" className="button button-secondary" onClick={handleResetClick}>Сбросить</button>
            </div>
        </div>
    );
}


function SchemeList({ schemes: propSchemes, isMySchemesPage = false, nextPageUrl: propNext, prevPageUrl: propPrev, onPageChange: propOnPageChange }) {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [prevPageUrl, setPrevPageUrl] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const [categories, setCategories] = useState([]);
    const [licenses, setLicenses] = useState([]);
    const [allTags, setAllTags] = useState([]);

    const fetchSchemes = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(url);
            setSchemes(response.data.results);
            setNextPageUrl(response.data.next);
            setPrevPageUrl(response.data.previous);
        } catch (err) { setError("Не удалось загрузить схемы."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!isMySchemesPage) {
            Promise.all([
                apiClient.get('/categories/'),
                apiClient.get('/licenses/'),
                apiClient.get('/tags/')
            ]).then(([categoriesRes, licensesRes, tagsRes]) => {
                setCategories(categoriesRes.data.results || categoriesRes.data);
                setLicenses(licensesRes.data.results || licensesRes.data);
                setAllTags((tagsRes.data.results || tagsRes.data).map(tag => ({ value: tag.name, label: tag.name })));
            }).catch(err => console.error("Не удалось загрузить данные для фильтров", err));
        }
    }, [isMySchemesPage]);

    useEffect(() => {
        if (propSchemes) {
            setSchemes(propSchemes); setLoading(false); setNextPageUrl(null); setPrevPageUrl(null);
        } else {
            const queryString = searchParams.toString();
            fetchSchemes(`/schemes/?${queryString}`);
        }
    }, [propSchemes, fetchSchemes, searchParams]);

    const handleFilterChange = (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        setSearchParams(params);
    };

    // --- ИЗМЕНЕНИЕ 5: Функция для сброса фильтров ---
    const handleResetFilters = () => {
        // Устанавливаем пустые параметры, что приведет к перезагрузке данных
        setSearchParams({});
    };

    if (loading) return <p>Загрузка схем...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="schemes-page-container">
            {!isMySchemesPage && (<header className="page-header"><h1>Схемы вышивки</h1></header>)}
            {!isMySchemesPage && (
                <aside className="schemes-sidebar">
                    {/* --- ИЗМЕНЕНИЕ 6: Передаем новую функцию в FilterPanel --- */}
                    <FilterPanel
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        categories={categories}
                        licenses={licenses}
                        allTags={allTags}
                    />
                </aside>
            )}
            <main className="schemes-main-content">
                {schemes.length > 0 ? (
                     <>
                        <div className="scheme-list-grid">
                            {schemes.map(scheme => (
                                <Link to={`/schemes/${scheme.id}`} key={scheme.id} className="scheme-card-link">
                                    <div className="scheme-card">
                                        <img src={scheme.main_image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={`Превью для ${scheme.title}`} className="scheme-card-image"/>
                                        <div className="scheme-card-info">
                                            <h3 className="scheme-card-title">{scheme.title}</h3>
                                            <p className="scheme-card-author">{scheme.author ? scheme.author.username : 'Неизвестен'}</p>
                                            {scheme.tags && scheme.tags.length > 0 && (
                                                <div className="scheme-card-tags">{scheme.tags.slice(0, 4).map((tag, index) => (<span key={index} className="scheme-tag-badge">#{tag.name || tag}</span>))}</div>
                                            )}
                                            <div className="scheme-card-stats">
                                                <span>👁️ {scheme.views_count}</span>
                                                <span>❤️ {scheme.likes_count}</span>
                                                <span>📥 {scheme.total_downloads_count}</span>
                                                <span>⭐ {scheme.favorites_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {(nextPageUrl || prevPageUrl) && (
                             <div className="pagination-controls">
                                <button className="button" disabled={!prevPageUrl} onClick={() => fetchSchemes(prevPageUrl)}>← Назад</button>
                                <button className="button" disabled={!nextPageUrl} onClick={() => fetchSchemes(nextPageUrl)}>Вперед →</button>
                            </div>
                        )}
                    </>
                ) : ( <p>По вашему запросу ничего не найдено. Попробуйте изменить фильтры или <button className="link-button" onClick={handleResetFilters}>сбросить их</button>.</p> )}
            </main>
        </div>
    );
}

export default SchemeList;