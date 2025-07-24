# backend/api/permissions.py

from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAuthorOrReadOnly(BasePermission):
    """
    Пользовательское разрешение, которое позволяет редактировать объект
    только его автору. Остальным доступно только чтение.
    """
    message = 'Редактирование и удаление чужих схем запрещено.'

    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD, OPTIONS запросы всем.
        # SAFE_METHODS - это кортеж ('GET', 'HEAD', 'OPTIONS').
        if request.method in SAFE_METHODS:
            return True

        # Для остальных методов (POST, PUT, DELETE) проверяем,
        # является ли пользователь автором объекта.
        # `obj` - это и есть наша схема (экземпляр EmbroideryScheme).
        return obj.author == request.user