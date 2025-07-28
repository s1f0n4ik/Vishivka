// frontend/src/components/SchemeList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';

// --- Компонент фильтров теперь тоже использует новые стили ---
function FilterPanel({ onFilterChange, categories }) {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');

    const handleFilter = (e) => {
        e.preventDefault();
        onFilterChange({ search: searchTerm, category: category, difficulty: difficulty });
    };

    // Применяем классы из App.css к панели фильтров
    return (
        <form onSubmit={handleFilter} className="filter-panel">
            <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Все категории</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="">Любая сложность</option>
                <option value="easy">Лёгкая</option>
                <option value="medium">Средняя</option>
                <option value="hard">Сложная</option>
            </select>
            <button type="submit">Найти</button>
        </form>
    );
}

function SchemeList({ schemes: propSchemes, isMySchemesPage = false }) {
    // ... весь ваш код с хуками (useState, useEffect и т.д.) остается БЕЗ ИЗМЕНЕНИЙ ...
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [prevPageUrl, setPrevPageUrl] = useState(null);
    const [categories, setCategories] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();

    const fetchSchemes = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(url);
            setSchemes(response.data.results);
            setNextPageUrl(response.data.next);
            setPrevPageUrl(response.data.previous);
        } catch (err) {
            setError("Не удалось загрузить схемы.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isMySchemesPage) {
            apiClient.get('/categories/')
                .then(res => setCategories(res.data))
                .catch(err => console.error("Не удалось загрузить категории для фильтра", err));
        }
    }, [isMySchemesPage]);

    useEffect(() => {
        if (propSchemes) {
            setSchemes(propSchemes);
            setLoading(false);
            setNextPageUrl(null);
            setPrevPageUrl(null);
        } else {
            const queryString = searchParams.toString();
            fetchSchemes(`/schemes/?${queryString}`);
        }
    }, [propSchemes, fetchSchemes, searchParams]);

    const handleFilterChange = (filters) => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.category) params.set('category', filters.category);
        if (filters.difficulty) params.set('difficulty', filters.difficulty);
        setSearchParams(params);
    };


    if (loading) return <p>Загрузка схем...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // --- НАЧАЛО ИЗМЕНЕНИЙ В РАЗМЕТКЕ ---
    return (
        <div className="container">
            {!isMySchemesPage && <FilterPanel onFilterChange={handleFilterChange} categories={categories} />}

            {schemes.length > 0 ? (
                <>
                    <div className="scheme-list-grid">
                        {schemes.map(scheme => (
                            // Вся карточка теперь одна большая ссылка
                            <Link to={`/schemes/${scheme.id}`} key={scheme.id} className="scheme-card-link">
                                <div className="scheme-card">
                                    <img
                                        src={scheme.main_image || 'https://via.placeholder.com/300x200?text=No+Image'}
                                        alt={`Превью для ${scheme.title}`}
                                        className="scheme-card-image"
                                    />
                                    <div className="scheme-card-info">
                                        <h3 className="scheme-card-title">{scheme.title}</h3>
                                        <p className="scheme-card-author">
                                            {scheme.author ? scheme.author.username : 'Неизвестен'}
                                        </p>
                                        {/* Дополнительная информация в карточке */}
                                        <div className="scheme-card-stats">
                                            <span>👁️ {scheme.views_count}</span>
                                            <span>
                                                {scheme.is_favorited ? '❤️' : '🤍'}{' '}
                                                {scheme.favorites_count}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {(nextPageUrl || prevPageUrl) && (
                         <div className="pagination-controls">
                            {prevPageUrl && (<button onClick={() => fetchSchemes(prevPageUrl)}>&larr; Назад</button>)}
                            {nextPageUrl && (<button onClick={() => fetchSchemes(nextPageUrl)}>Вперед &rarr;</button>)}
                        </div>
                    )}
                </>
            ) : (
                 isMySchemesPage ?
                 <p>Вы еще не добавили ни одной схемы. <Link to="/add-scheme">Хотите добавить первую?</Link></p>
                 :
                 <p>По вашему запросу ничего не найдено. Попробуйте изменить фильтры.</p>
            )}
        </div>
    );
    // --- КОНЕЦ ИЗМЕНЕНИЙ В РАЗМЕТКЕ ---
}

export default SchemeList;