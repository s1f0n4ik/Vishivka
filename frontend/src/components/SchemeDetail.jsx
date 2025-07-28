// frontend/src/components/SchemeDetail.jsx
import React, { useState, useEffect, useContext } from 'react'; // Добавили useContext
import { useParams, Link, useNavigate } from 'react-router-dom'; // Добавили Link и useNavigate
import apiClient from '../api/apiClient';
import AuthContext from '../context/AuthContext'; // Импортируем наш контекст

function SchemeDetail() {
  const { id } = useParams();
  const navigate = useNavigate(); // Хук для редиректа
  const { user } = useContext(AuthContext); // Получаем текущего пользователя

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ... (код fetchScheme без изменений)
    const fetchScheme = async () => {
      try {
        const response = await apiClient.get(`/schemes/${id}/`);
        setScheme(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [id]);

  // Функция удаления
  const handleDelete = async () => {
    // Спрашиваем подтверждение
    if (window.confirm('Вы уверены, что хотите удалить эту схему? Это действие необратимо.')) {
      try {
        await apiClient.delete(`/schemes/${id}/`);
        alert('Схема успешно удалена!');
        navigate('/'); // Перенаправляем на главную
      } catch (err) {
        console.error('Ошибка при удалении:', err);
        alert('Не удалось удалить схему. Возможно, у вас нет прав.');
      }
    }
  };

  if (loading) return <p>Загрузка схемы...</p>;
  if (error) return <p>Ошибка при загрузке схемы.</p>;
  if (!scheme) return <p>Схема не найдена.</p>;

  console.log("Текущий пользователь (из контекста):", user);
  console.log("Автор схемы (из API):", scheme.author);

  // Проверяем, является ли текущий пользователь автором схемы
  const isAuthor = user && scheme.author && user.user_id == scheme.author.id;

  return (
    <div>
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

      {/* Отображаем картинку только если есть URL */}
      {scheme.main_image && <img src={scheme.main_image} alt={`Превью для ${scheme.title}`} style={{ maxWidth: '400px', height: 'auto' }} />}

      {/* ----- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ----- */}
      {/* Используем "опциональную цепочку" (?.) и оператор "nullish coalescing" (??) */}
      {/* Это безопасно выведет имя, если оно есть, или текст-заглушку, если нет */}
      <p><strong>Автор:</strong> {scheme.author ? (
            <Link to={`/profile/${scheme.author.username}`}>
                {scheme.author.username}
            </Link>
        ) : (
            'Не указан'
        )}</p>
      <p><strong>Категория:</strong> {scheme.category?.name ?? 'Не указана'}</p>
      {/* ------------------------------------------- */}

      <p><strong>Описание:</strong> {scheme.description || 'Описание отсутствует.'}</p>

      {/* Добавим проверку и для тегов, на всякий случай */}
      <p><strong>Теги:</strong> {scheme.tags && scheme.tags.length > 0 ? scheme.tags.map(tag => tag.name).join(', ') : 'Тегов нет'}</p>

      <p><strong>Просмотры:</strong> {scheme.views_count}</p>
      <hr />
      <h3>Файлы для скачивания:</h3>
      {scheme.files && scheme.files.length > 0 ? (
        <ul>
          {scheme.files.map(file => (
            <li key={file.id}>
              {/* 'file.file_url' - это поле, которое мы добавили в SchemeFileSerializer */}
              <a href={file.file_url} download>
                Скачать схему ({file.get_file_type_display})
              </a>
              {file.description && <span> - {file.description}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p>К этой схеме еще не добавили файлов.</p>
      )}
    </div>
  );
}

export default SchemeDetail;