# backend/users/serializers.py

from rest_framework import serializers
from .models import User, Profile
# --- УДАЛЯЕМ ЭТУ СТРОКУ ---
# Мы больше не импортируем сериализатор схемы на верхнем уровне
# from api.serializers import EmbroiderySchemeListSerializer


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        exclude = ('user',)


class UserSerializer(serializers.ModelSerializer):
    """Базовый сериализатор пользователя, используется в списках."""
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Расширенный сериализатор для детального просмотра профиля пользователя.
    Включает в себя список публичных схем пользователя.
    """
    profile = ProfileSerializer(read_only=True)
    schemes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'date_joined', 'profile', 'schemes')

    def get_schemes(self, obj):
        """
        Возвращает список только ПУБЛИЧНЫХ схем пользователя.
        'obj' - это экземпляр модели User.
        """
        # --- ДОБАВЛЯЕМ ЛОКАЛЬНЫЙ ИМПОРТ ЗДЕСЬ ---
        # Этот импорт происходит только при вызове метода,
        # разрывая циклическую зависимость при запуске приложения.
        from api.serializers import EmbroiderySchemeListSerializer

        public_schemes = obj.schemes.filter(visibility='PUB')
        request = self.context.get('request')
        serializer = EmbroiderySchemeListSerializer(public_schemes, many=True, context={'request': request})
        return serializer.data