# backend/users/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import User
from .serializers import UserSerializer, UserProfileSerializer, UserUpdateSerializer
from .permissions import IsSelf  # Импортируем наши права доступа


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related('profile', 'schemes')
    lookup_field = 'username'  # Позволяет искать пользователей по имени, а не по id

    def get_serializer_class(self):
        # Для просмотра списка
        if self.action == 'list':
            return UserSerializer
        # Для обновления данных
        if self.action in ['update', 'partial_update', 'me_update']:
            return UserUpdateSerializer
        # Для детального просмотра
        return UserProfileSerializer

    def get_permissions(self):
        # Для обновления данных требуем, чтобы это был сам пользователь
        if self.action in ['update', 'partial_update', 'me', 'me_update']:
            return [permissions.IsAuthenticated(), IsSelf()]
        # В остальных случаях (просмотр) - разрешаем всем
        return [permissions.AllowAny()]

    # --- НАШ СПЕЦИАЛЬНЫЙ ENDPOINT ---
    # detail=False означает, что он будет доступен по адресу /api/v1/users/me/
    # а не /api/v1/users/{pk}/me/
    @action(['get', 'put', 'patch'], detail=False)
    def me(self, request, *args, **kwargs):
        self.get_object = self.get_current_user
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            # Используем action 'me_update' для выбора правильного сериализатора
            self.action = 'me_update'
            instance = request.user
            serializer = self.get_serializer(instance, data=request.data, partial=True) # partial=True для PATCH
            serializer.is_valid(raise_exception=True)
            serializer.save()
            # Возвращаем обновленные данные с помощью сериализатора для чтения
            read_serializer = UserProfileSerializer(instance, context={'request': request})
            return Response(read_serializer.data)

    def get_current_user(self):
        return self.request.user