// frontend/src/components/SchemeList.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Link } from 'react-router-dom';

function SchemeList() {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                // ВАЖНО: DRF с пагинацией по умолчанию кладет данные в `response.data.results`.
                // Без пагинации - просто в `response.data`. Давайте будем готовы к обоим случаям.
                const response = await apiClient.get('/schemes/');
                setSchemes(response.data.results || response.data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchemes();
    }, []);

    if (loading) {
        return <p>Загрузка схем...</p>;
    }

    if (error) {
        console.error("Ошибка при загрузке схем:", error);
        return <p>Ошибка при загрузке данных. Откройте консоль (F12) для подробностей.</p>;
    }

    return (
        <div>
            <h2>Список схем</h2>
            {schemes.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {schemes.map(scheme => (
                        <li key={scheme.id} style={{ border: '1px solid #ccc', marginBottom: '20px', padding: '15px' }}>
                            {/* === ИСПРАВЛЕНИЕ ЗДЕСЬ === */}

                            {/* 1. Добавляем картинку-превью, если она есть */}
                            {scheme.main_image && (
                                <Link to={`/schemes/${scheme.id}`}>
                                    <img
                                      src={scheme.main_image}
                                      alt={`Превью для ${scheme.title}`}
                                      style={{ maxWidth: '200px', height: 'auto', float: 'left', marginRight: '15px' }}
                                    />
                                </Link>
                            )}

                            <div>
                                <h3>
                                    <Link to={`/schemes/${scheme.id}`}>
                                        {scheme.title}
                                    </Link>
                                </h3>

                                {/* 2. Отображаем автора и категорию как строки и добавляем проверку на их существование */}
                                <p><strong>Автор:</strong> {scheme.author || 'Не указан'}</p>
                                <p><strong>Категория:</strong> {scheme.category || 'Без категории'}</p>
                                <p><strong>Теги:</strong> {scheme.tags && scheme.tags.length > 0 ? scheme.tags.join(', ') : 'Нет тегов'}</p>
                            </div>
                            <div style={{clear: 'both'}}></div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Схем пока нет. <Link to="/create-scheme">Добавить первую схему?</Link></p>
            )}
        </div>
    );
}

export default SchemeList;