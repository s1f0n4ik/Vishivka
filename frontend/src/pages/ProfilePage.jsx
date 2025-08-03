// frontend/src/pages/ProfilePage.jsx

import React, { useState, useEffect, useContext } from 'react'; // Добавьте useContext
    import { Link } from 'react-router-dom'; // Добавьте Link
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import SchemeList from '../components/SchemeList'; // Мы переиспользуем наш компонент!
import AuthContext from '../context/AuthContext';

function ProfilePage() {
    const { username } = useParams(); // Получаем username из URL
    const { user } = useContext(AuthContext);
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
                    {user && user.username === username && (
                        <Link to="/profile/edit" className="button button-secondary" style={{marginBottom: '1rem'}}>
                            Редактировать профиль
                        </Link>
                    )}
                    <p><strong>На сайте с:</strong> {registrationDate}</p>
                    {profile.profile.bio && <p><strong>О себе:</strong> {profile.profile.bio}</p>}
                    {profile.profile.location && <p><strong>Город:</strong> {profile.profile.location}</p>}

                    <div className="profile-contacts" style={{ marginTop: '15px' }}>
                        {profile.email &&
                            <p><strong>Email:</strong> <a href={`mailto:${profile.email}`}>{profile.email}</a></p>
                        }
                        {profile.profile.social_telegram &&
                            <p><strong>Telegram:</strong> <a href={`https://t.me/${profile.profile.social_telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">{profile.profile.social_telegram}</a></p>
                        }
                        {profile.profile.social_vk &&
                             <p><strong>ВКонтакте:</strong> <a href={profile.profile.social_vk} target="_blank" rel="noopener noreferrer">Перейти к профилю</a></p>
                        }
                    </div>

                </div>
            </div>

{/*             <h3>Схемы пользователя {profile.username}:</h3> */}
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
