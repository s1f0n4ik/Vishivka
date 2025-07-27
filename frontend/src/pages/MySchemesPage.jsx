// frontend/src/pages/MySchemesPage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import SchemeList from '../components/SchemeList';

function MySchemesPage() {
    const [schemes, setSchemes] = useState(null); // Начальное состояние null
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMySchemes = async () => {
            try {
                const response = await apiClient.get('/schemes/my/');
                // Теперь мы уверены, что response.data - это МАССИВ
                setSchemes(response.data);
            } catch (err) {
                console.error("Ошибка при загрузке ваших схем:", err);
                setError('Не удалось загрузить ваши схемы.');
            } finally {
                setLoading(false);
            }
        };

        fetchMySchemes();
    }, []);

    if (loading) return <p>Загрузка ваших схем...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // Если загрузка завершилась, а схем нет или пришел не массив
    if (!schemes) return <p>Не удалось загрузить данные.</p>;

    return (
        <div>
            <h2>Мои схемы</h2>
            {/* Просто передаем массив в SchemeList. Он сам разберется. */}
            <SchemeList schemes={schemes} isMySchemesPage={true} />
        </div>
    );
}

export default MySchemesPage;