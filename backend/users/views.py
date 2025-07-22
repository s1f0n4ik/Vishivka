# users/views.py
from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint для просмотра пользователей.
    Предоставляет только действия `list` и `retrieve`.
    """
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]  # Просматривать профили могут только залогиненные пользователи
