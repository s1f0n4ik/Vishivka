// frontend/src/pages/FavoritedSchemesPage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import SchemeList from '../components/SchemeList';
import { Link } from 'react-router-dom';

function FavoritedSchemesPage() {
    const [schemes, setSchemes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Состояние для пагинации
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [prevPageUrl, setPrevPageUrl] = useState(null);

    // Оборачиваем в useCallback, чтобы передавать в SchemeList
    const fetchFavoritedSchemes = React.useCallback(async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(url);
            setSchemes(response.data.results); // Данные теперь в results
            setNextPageUrl(response.data.next);
            setPrevPageUrl(response.data.previous);
        } catch (err) {
            console.error("Ошибка при загрузке избранных схем:", err);
            setError('Не удалось загрузить ваши избранные схемы.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavoritedSchemes('/schemes/favorited/');
    }, [fetchFavoritedSchemes]);

    if (loading) return <p>Загрузка избранных схем...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!schemes) return <p>Не удалось загрузить данные.</p>;

    return (
        <div>
            <h2>Моё избранное</h2>
            {/* Передаем данные в SchemeList, который умеет их отображать */}
            <SchemeList
                schemes={schemes}
                // isMySchemesPage={true} // Можно оставить, чтобы убрать фильтры
                // Либо передать все данные для пагинации
                nextPageUrl={nextPageUrl}
                prevPageUrl={prevPageUrl}
                onPageChange={fetchFavoritedSchemes} // Передаем функцию для смены страниц
            />
            {schemes.length === 0 && (
                <p>Вы еще не добавили ни одной схемы в избранное. <Link to="/">Найти схемы</Link></p>
            )}
        </div>
    );
}

export default FavoritedSchemesPage;