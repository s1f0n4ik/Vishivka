// frontend/src/components/SchemeDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
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
        // Запрос данных о схеме
        const schemeResponse = await apiClient.get(`/schemes/${id}/`); // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
        setScheme(schemeResponse.data);
        // Запрос комментариев для этой схемы
        const commentsResponse = await apiClient.get(`/schemes/${id}/comments/`); // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
        // Сортируем комментарии, чтобы новые были внизу
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
    // ... (код этой функции уже использует apiClient и остается без изменений)
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
        favorites_count: prevScheme.is_favorited
          ? prevScheme.favorites_count - 1
          : prevScheme.favorites_count + 1
      }));
    } catch (err) {
      console.error("Ошибка при добавлении в избранное:", err);
      alert("Не удалось выполнить действие. Попробуйте снова.");
    }
  };

  const handleDelete = async () => {
    // ... (код этой функции уже использует apiClient и остается без изменений)
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(`/schemes/${id}/comments/`, { // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
        text: newComment,
      });
      // Добавляем новый коммент в конец списка
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

  // <-- ИСПРАВЛЕНИЕ ПРОВЕРКИ АВТОРСТВА -->
  const isAuthor = user && scheme.author && user.id === scheme.author.id;

  return (
    <div>
        {/* ... (весь ваш JSX остается здесь без изменений) ... */}

      {/* Панель управления для автора */}
      {isAuthor && (
        <div style={{ float: 'right', border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
          <Link to={`/schemes/${id}/edit`}>
            <button>Редактировать</button>
          </Link>
          <button onClick={handleDelete} style={{ marginLeft: '10px', backgroundColor: '#f44336', color: 'white' }}>
            Удалить
          </button>
        </div>
      )}
      <h2>{scheme.title}</h2>

      {/* Кнопка избранного */}
      {user && (
          <div style={{ margin: '15px 0' }}>
            <button onClick={handleFavoriteToggle}>
              {scheme.is_favorited ? '❤️ Убрать из избранного' : '🤍 Добавить в избранное'}
            </button>
            <span style={{ marginLeft: '10px' }}>
              В избранном у {scheme.favorites_count} чел.
            </span>
          </div>
      )}

      {/* Детали схемы */}
      {scheme.main_image && <img src={scheme.main_image} alt={`Превью для ${scheme.title}`} style={{ maxWidth: '400px', height: 'auto' }} />}
      <p><strong>Автор:</strong> {scheme.author ? <Link to={`/profile/${scheme.author.username}`}>{scheme.author.username}</Link> : 'Не указан'}</p>
      {/* ... и так далее ... */}

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