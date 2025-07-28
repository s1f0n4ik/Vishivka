// frontend/src/components/SchemeList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
// import './SchemeList.css';

// --- Новый компонент для фильтров ---
function FilterPanel({ onFilterChange, categories }) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Состояния для значений в полях формы
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');

    const handleFilter = (e) => {
        e.preventDefault();
        onFilterChange({
            search: searchTerm,
            category: category,
            difficulty: difficulty
        });
    };

    return (
        <form onSubmit={handleFilter} className="filter-panel" style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
            <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '8px' }}
            />
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px' }}>
                <option value="">Все категории</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ padding: '8px' }}>
                <option value="">Любая сложность</option>
                <option value="easy">Лёгкая</option>
                <option value="medium">Средняя</option>
                <option value="hard">Сложная</option>
            </select>
            <button type="submit" style={{ padding: '8px 15px' }}>Найти</button>
        </form>
    );
}


function SchemeList({ schemes: propSchemes, isMySchemesPage = false }) {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [prevPageUrl, setPrevPageUrl] = useState(null);

    // --- Состояние для списка категорий (для фильтра) ---
    const [categories, setCategories] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();

    // --- УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ЗАГРУЗКИ ---
    // Теперь она принимает полный URL и просто выполняет запрос
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

    // Эффект для загрузки категорий для фильтра
    useEffect(() => {
        if (!isMySchemesPage) { // Загружаем категории только для главной страницы
            apiClient.get('/categories/')
                .then(res => setCategories(res.data))
                .catch(err => console.error("Не удалось загрузить категории для фильтра", err));
        }
    }, [isMySchemesPage]);

    // Эффект для первоначальной загрузки схем
    useEffect(() => {
        if (propSchemes) { // Для страницы "Мои схемы"
            setSchemes(propSchemes);
            setLoading(false);
            setNextPageUrl(null);
            setPrevPageUrl(null);
        } else { // Для главной страницы (с фильтрами)
            const queryString = searchParams.toString();
            fetchSchemes(`/schemes/?${queryString}`);
        }
    }, [propSchemes, fetchSchemes, searchParams]);

    // Функция, которую вызовет панель фильтров
    const handleFilterChange = (filters) => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.category) params.set('category', filters.category);
        if (filters.difficulty) params.set('difficulty', filters.difficulty);
        setSearchParams(params); // Это действие вызовет перезапуск useEffect
    };

    if (loading) return <p>Загрузка схем...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            {/* Панель фильтров показывается только на главной странице */}
            {!isMySchemesPage && <FilterPanel onFilterChange={handleFilterChange} categories={categories} />}

            {schemes.length > 0 ? (
                <>
                    <div className="scheme-list-container">
                        {schemes.map(scheme => (
                            <div key={scheme.id} className="scheme-card">
                                <Link to={`/schemes/${scheme.id}`}>
                                    <img src={scheme.main_image || 'https://via.placeholder.com/300x200.png?text=No+Image'} alt={scheme.title} />
                                    <h3>{scheme.title}</h3>
                                </Link>
                                <p>
                                    Автор:{' '}
                                    {scheme.author ? (
                                        <Link to={`/profile/${scheme.author.username}`}>
                                            {scheme.author.username}
                                        </Link>
                                    ) : (
                                        'Неизвестен'
                                    )}
                                </p>
                                <p>Просмотров: {scheme.views_count}</p>
                            </div>
                        ))}
                    </div>

                    {(nextPageUrl || prevPageUrl) && (
                         <div className="pagination-controls">
                            {/* Используем полный URL с сервера, он уже содержит параметры фильтрации */}
                            {prevPageUrl && (<button onClick={() => fetchSchemes(prevPageUrl)}>&larr; Предыдущая</button>)}
                            {nextPageUrl && (<button onClick={() => fetchSchemes(nextPageUrl)}>Следующая &rarr;</button>)}
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
}

export default SchemeList;