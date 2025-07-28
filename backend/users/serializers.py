# backend/users/serializers.py

from rest_framework import serializers
from .models import User, Profile
from api.serializers import EmbroiderySchemeListSerializer


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
    # Используем SerializerMethodField для гибкого контроля над тем, что отдаем
    schemes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'date_joined', 'profile', 'schemes')

    def get_schemes(self, obj):
        """
        Возвращает список только ПУБЛИЧНЫХ схем пользователя.
        'obj' - это экземпляр модели User.
        """
        # Фильтруем схемы по автору и статусу видимости
        public_schemes = obj.schemes.filter(visibility='PUB')
        # Сериализуем отфильтрованный список, используя готовый сериализатор для списков
        # request передается в контекст для построения полных URL изображений
        request = self.context.get('request')
        serializer = EmbroiderySchemeListSerializer(public_schemes, many=True, context={'request': request})
        return serializer.data