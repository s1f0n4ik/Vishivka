# backend/users/views.py

from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer, UserProfileSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint для просмотра пользователей.
    - `list`: список всех пользователей (базовая информация).
    - `retrieve`: детальная информация о пользователе для страницы профиля.
    """
    queryset = User.objects.all().select_related('profile').prefetch_related('schemes')
    permission_classes = [permissions.IsAuthenticated]

    # --- ДОБАВЛЯЕМ ЭТИ ДВЕ СТРОКИ ---
    # Указываем, что в URL для поиска будет использоваться поле 'username'
    lookup_field = 'username'

    def get_serializer_class(self):
        """
        Выбираем сериализатор в зависимости от действия.
        """
        if self.action == 'retrieve':
            # Для детального просмотра (страница профиля) используем расширенный сериализатор
            return UserProfileSerializer
        # Для списка пользователей (если понадобится) - базовый
        return UserSerializer