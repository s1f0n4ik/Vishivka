// frontend/src/components/UserMenu.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  if (!user) return null;

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-avatar-button" onClick={() => setIsOpen(!isOpen)}>
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
        {/* Проверяем, есть ли у пользователя и его профиля аватар */}
        {user.profile && user.profile.avatar ? (
          // Если есть - показываем картинку
          <img src={user.profile.avatar} alt={`Аватар ${user.username}`} />
        ) : (
          // Если нет - показываем первую букву имени
          user.username.charAt(0)
        )}
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            Вошли как<br/><strong>{user.username}</strong>
          </div>
          <Link to={`/profile/${user.username}`} className="dropdown-item" onClick={() => setIsOpen(false)}>
            Профиль
          </Link>
          <Link to="/profile/edit" className="dropdown-item" onClick={() => setIsOpen(false)}>
                Настройки профиля
          </Link>
          <Link to="/my-schemes" className="dropdown-item" onClick={() => setIsOpen(false)}>
            Мои схемы
          </Link>
          <button onClick={onLogout} className="dropdown-item dropdown-item-logout">
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;