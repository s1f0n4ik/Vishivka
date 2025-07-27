// frontend/src/components/SchemeList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
// import './SchemeList.css';

function SchemeList({ schemes: propSchemes, isMySchemesPage = false }) {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [prevPageUrl, setPrevPageUrl] = useState(null);

    const fetchPaginatedSchemes = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(url);
            // Работаем с пагинированным ответом
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
        // Сценарий 1: Схемы переданы извне (как массив)
        if (propSchemes) {
            setSchemes(propSchemes);
            setLoading(false);
            // Убираем кнопки пагинации для этого случая
            setNextPageUrl(null);
            setPrevPageUrl(null);
        }
        // Сценарий 2: Главная страница, загружаем сами
        else {
            fetchPaginatedSchemes('/schemes/');
        }
    }, [propSchemes, fetchPaginatedSchemes]);

    if (loading) return <p>Загрузка схем...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            {schemes.length > 0 ? (
                <>
                    <div className="scheme-list-container">
                        {schemes.map(scheme => (
                            <div key={scheme.id} className="scheme-card">
                                <Link to={`/schemes/${scheme.id}`}>
                                    <img src={scheme.main_image || 'https://via.placeholder.com/300x200.png?text=No+Image'} alt={scheme.title} />
                                    <h3>{scheme.title}</h3>
                                </Link>
                                <p>Автор: {scheme.author?.username || 'Неизвестен'}</p>
                                <p>Просмотров: {scheme.views_count}</p>
                            </div>
                        ))}
                    </div>

                    {(nextPageUrl || prevPageUrl) && (
                         <div className="pagination-controls">
                            {prevPageUrl && (<button onClick={() => fetchPaginatedSchemes(prevPageUrl)}>&larr; Предыдущая</button>)}
                            {nextPageUrl && (<button onClick={() => fetchPaginatedSchemes(nextPageUrl)}>Следующая &rarr;</button>)}
                        </div>
                    )}
                </>
            ) : (
                 isMySchemesPage ?
                 <p>Вы еще не добавили ни одной схемы. <Link to="/add-scheme">Хотите добавить первую?</Link></p>
                 :
                 <p>Схем пока нет. <Link to="/add-scheme">Добавить первую схему?</Link></p>
            )}
        </div>
    );
}

export default SchemeList;