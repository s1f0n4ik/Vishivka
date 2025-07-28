// frontend/src/pages/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import SchemeList from '../components/SchemeList'; // Мы переиспользуем наш компонент!

function ProfilePage() {
    const { username } = useParams(); // Получаем username из URL
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!username) {
            setError("Имя пользователя не указано.");
            setLoading(false);
            return; // Прекращаем выполнение эффекта
        }
        const fetchProfile = async () => {
            setLoading(true);
            try {
                // Запрашиваем пользователя по username, как мы настроили на бэкенде
                const response = await apiClient.get(`/users/${username}/`);
                setProfile(response.data);
            } catch (err) {
                console.error("Ошибка загрузки профиля:", err);
                setError("Не удалось загрузить профиль пользователя. Возможно, он не существует.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]); // Перезагружаем данные, если username в URL изменился

    if (loading) return <p>Загрузка профиля...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!profile) return <p>Профиль не найден.</p>;

    // Форматируем дату регистрации для красивого вывода
    const registrationDate = new Date(profile.date_joined).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="profile-page">
            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <img
                    src={profile.profile.avatar || 'https://i.pravatar.cc/150?u=' + profile.username}
                    alt={`Аватар ${profile.username}`}
                    style={{ width: '150px', height: '150px', borderRadius: '50%', marginRight: '30px' }}
                />
                <div>
                    <h2>{profile.username}</h2>
                    <p><strong>На сайте с:</strong> {registrationDate}</p>
                    {profile.profile.bio && <p><strong>О себе:</strong> {profile.profile.bio}</p>}
                    {profile.profile.location && <p><strong>Город:</strong> {profile.profile.location}</p>}
                </div>
            </div>

            <h3>Схемы пользователя {profile.username}:</h3>
            {profile.schemes && profile.schemes.length > 0 ? (
                // Просто передаем массив схем из профиля в наш готовый компонент!
                <SchemeList schemes={profile.schemes} />
            ) : (
                <p>Этот пользователь еще не добавил ни одной публичной схемы.</p>
            )}
        </div>
    );
}

export default ProfilePage;
