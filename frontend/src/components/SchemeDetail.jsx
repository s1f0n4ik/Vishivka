// frontend/src/components/SchemeDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient, { API_BASE_URL } from '../api/apiClient'; // Теперь импорт работает корректно
import AuthContext from '../context/AuthContext';

function SchemeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSchemeAndComments = async () => {
            try {
                setLoading(true);
                const schemeResponse = await apiClient.get(`/schemes/${id}/`);
                setScheme(schemeResponse.data);
                const commentsResponse = await apiClient.get(`/schemes/${id}/comments/`);
                setComments(commentsResponse.data.results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
            } catch (err) {
                setError('Не удалось загрузить данные.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchemeAndComments();
    }, [id]);

    const handleFavoriteToggle = async () => {
        if (!user) {
            alert("Пожалуйста, войдите в систему, чтобы добавлять схемы в избранное.");
            navigate('/login');
            return;
        }
        try {
            await apiClient.post(`/schemes/${id}/favorite/`);
            setScheme(prevScheme => ({
                ...prevScheme,
                is_favorited: !prevScheme.is_favorited,
                favorites_count: prevScheme.is_favorited ? prevScheme.favorites_count - 1 : prevScheme.favorites_count + 1
            }));
        } catch (err) {
            console.error("Ошибка при добавлении в избранное:", err);
            alert("Не удалось выполнить действие. Попробуйте снова.");
        }
    };

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Реализуем функцию удаления ---
    const handleDelete = async () => {
        if (window.confirm('Вы уверены, что хотите удалить эту схему? Это действие необратимо.')) {
            try {
                await apiClient.delete(`/schemes/${id}/`);
                alert('Схема успешно удалена.');
                navigate('/'); // Перенаправляем на главную страницу
            } catch (err) {
                console.error("Ошибка при удалении схемы:", err);
                alert('Не удалось удалить схему.');
            }
        }
    };


  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(`/schemes/${id}/comments/`, {
        text: newComment,
      });
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error("Ошибка при добавлении комментария:", error);
      alert("Не удалось добавить комментарий. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>Загрузка схемы...</p>;
  if (error) return <p>{error}</p>;
  if (!scheme) return <p>Схема не найдена.</p>;

  const isAuthor = user && scheme.author && user.id === scheme.author.id;

  return (
    <div className="scheme-detail-container"> {/* Добавляем общий контейнер для стилей */}
      {/* Панель управления для автора */}
      {isAuthor && (
        <div className="author-controls">
          <Link to={`/schemes/${id}/edit`} className="button button-edit">
            Редактировать
          </Link>
          <button onClick={handleDelete} className="button button-delete">
            Удалить
          </button>
        </div>
      )}

      <h2>{scheme.title}</h2>

      {/* Кнопка избранного */}
      {user && (
          <div className="favorite-controls">
            <button onClick={handleFavoriteToggle} className="button">
              {scheme.is_favorited ? '⭐ Убрать из избранного' : '☆ Добавить в избранное'}
            </button>
            <span>В избранном у {scheme.favorites_count} чел.</span>
          </div>
      )}

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
      <div className="scheme-content-grid">
          <div className="scheme-main-content">
              {scheme.main_image && (
                  <img src={scheme.main_image} alt={`Превью для ${scheme.title}`} className="scheme-detail-image" />
              )}

              {/* Описание схемы */}
              {scheme.description && (
                  <div className="scheme-section">
                      <h3>Описание</h3>
                      <p className="scheme-description">{scheme.description}</p>
                  </div>
              )}
          </div>
          <div className="scheme-sidebar">
              {/* Информация об авторе */}
              <div className="scheme-section author-info">
                  <strong>Автор:</strong>
                  <span>
                    {scheme.author ? <Link to={`/profile/${scheme.author.username}`}>{scheme.author.username}</Link> : 'Не указан'}
                  </span>
              </div>

              {scheme.files && scheme.files.length > 0 && (
                <div className="scheme-section">
                    <h3>Файлы для скачивания</h3>
                    <ul className="file-list">
                        {scheme.files.map(file => (
                            <li key={file.id} className="file-item">
                                <a
                                    href={`${API_BASE_URL}/schemes/${id}/download_file/${file.id}/`}
                                    className="file-link"
                                    target="_blank" // Открывать в новой вкладке, чтобы не уходить со страницы
                                    rel="noopener noreferrer"
                                >
                                    <span className="file-type">{file.get_file_type_display}</span>
                                    <span className="file-description">{file.description || 'Основной файл схемы'}</span>
                                    <span className="file-downloads">Скачан(о) {file.downloads_count} раз</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
              )}

              {/* Теги */}
              {scheme.tags && scheme.tags.length > 0 && (
                  <div className="scheme-section">
                      <strong>Теги:</strong>
                      <div className="scheme-tags-container">
                          {scheme.tags.map(tag => (
                              <span key={tag.id} className="scheme-tag-badge">
                                  #{tag.name}
                              </span>
                          ))}
                      </div>
                  </div>
              )}

              {/* Информация о лицензии */}
              {scheme.license && (
                  <div className="scheme-section license-info">
                      <strong>Лицензия:</strong>
                      <a href={scheme.license.url} target="_blank" rel="noopener noreferrer">
                          {scheme.license.name}
                      </a>
                      <p className="license-description">
                          {scheme.license.description}
                      </p>
                  </div>
              )}
          </div>
      </div>

      <hr style={{ borderColor: 'var(--border-color)', margin: '30px 0' }}/>

      {/* Секция комментариев */}
      <div className="comments-section">
            <h3>Комментарии ({comments.length})</h3>

            {user ? (
                <form onSubmit={handleCommentSubmit} className="comment-form">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Напишите ваш комментарий..."
                        required
                        disabled={isSubmitting}
                    />
                    <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                        {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </button>
                </form>
            ) : (
                <p>Чтобы оставить комментарий, пожалуйста, <Link to="/login">войдите</Link>.</p>
            )}

            <ul className="comment-list">
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <li key={comment.id} className="comment-item">
                            <div className="comment-author-avatar">
                                {comment.author.username.charAt(0)}
                            </div>
                            <div className="comment-content">
                                <div className="comment-header">
                                    <span className="comment-author-name">{comment.author.username}</span>
                                    <span className="comment-date">
                                        {new Date(comment.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <p className="comment-text">{comment.text}</p>
                            </div>
                        </li>
                    ))
                ) : (
                    <p>Комментариев пока нет. Будьте первым!</p>
                )}
            </ul>
        </div>
    </div>
  );
}

export default SchemeDetail;