// frontend/src/pages/ProfileEditPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthContext from '../context/AuthContext';

function ProfileEditPage() {
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        bio: '',
        location: '',
        social_telegram: '',
        social_vk: '',
        avatar: null, // Для превью
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    useEffect(() => {
        apiClient.get('/users/me/')
            .then(response => {
                const { username, email, profile } = response.data;
                setProfileData({
                    username,
                    email,
                    bio: profile.bio || '',
                    location: profile.location || '',
                    social_telegram: profile.social_telegram || '',
                    social_vk: profile.social_vk || '',
                    avatar: profile.avatar, // URL текущего аватара
                });
                setLoading(false);
            })
            .catch(err => {
                setError('Не удалось загрузить данные профиля.');
                setLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        if (e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            // Для локального превью
            setProfileData({ ...profileData, avatar: URL.createObjectURL(e.target.files[0]) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');

        const formData = new FormData();
        formData.append('username', profileData.username);
        formData.append('email', profileData.email);

        // FormData не может отправлять вложенные объекты, поэтому делаем так:
        formData.append('profile.bio', profileData.bio);
        formData.append('profile.location', profileData.location);
        formData.append('profile.social_telegram', profileData.social_telegram);
        formData.append('profile.social_vk', profileData.social_vk);

        if (avatarFile) {
            formData.append('profile.avatar', avatarFile);
        }

        try {
            const response = await apiClient.patch('/users/me/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess('Профиль успешно обновлен!');
            // Обновляем данные пользователя в глобальном контексте
            setUser(response.data);

            // --- ИЗМЕНЕНИЕ 3: Сразу переходим на страницу профиля ---
            navigate(`/profile/${response.data.username}`);
        } catch (err) {
            const errorData = err.response?.data;
            let errorMessage = 'Ошибка при обновлении профиля.';
            // Если бэкенд возвращает детальные ошибки по полям
            if (typeof errorData === 'object' && errorData !== null) {
                errorMessage += ' ' + Object.entries(errorData).map(([key, value]) => `${key}: ${value}`).join(', ');
            }
            setError(errorMessage);
            console.error(errorData);
        }
    };

    if (loading) return <p>Загрузка...</p>;

    return (
        <div className="form-container">
            <h2>Редактирование профиля</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group avatar-upload-group">
                    <label>Аватар</label>
                    <img src={profileData.avatar || 'https://i.pravatar.cc/150'} alt="Аватар" className="form-avatar-preview" />
                    <input type="file" onChange={handleAvatarChange} accept="image/*" />
                </div>

                <div className="form-group">
                    <label htmlFor="username">Имя пользователя</label>
                    <input type="text" id="username" name="username" value={profileData.username} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={profileData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="bio">О себе</label>
                    <textarea id="bio" name="bio" value={profileData.bio} onChange={handleChange}></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="location">Город</label>
                    <input type="text" id="location" name="location" value={profileData.location} onChange={handleChange} />
                </div>

                <h3 style={{marginTop: '2rem'}}>Контакты</h3>
                <div className="form-group">
                    <label htmlFor="social_telegram">Telegram (username)</label>
                    <input type="text" id="social_telegram" name="social_telegram" value={profileData.social_telegram} onChange={handleChange} placeholder="@username" />
                </div>
                <div className="form-group">
                    <label htmlFor="social_vk">Профиль ВКонтакте (URL)</label>
                    <input type="url" id="social_vk" name="social_vk" value={profileData.social_vk} onChange={handleChange} placeholder="https://vk.com/..." />
                </div>

                <button type="submit" className="button">Сохранить изменения</button>
            </form>
        </div>
    );
}

export default ProfileEditPage;