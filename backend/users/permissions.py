# backend/users/permissions.py

from rest_framework import permissions

class IsSelf(permissions.BasePermission):
    """
    Разрешает доступ только самому пользователю (для редактирования).
    """
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD, OPTIONS запросы всем
        if request.method in permissions.SAFE_METHODS:
            return True
        # Разрешаем редактирование только если объект - это сам пользователь
        return obj == request.user