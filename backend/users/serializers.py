# backend/users/serializers.py

from rest_framework import serializers
from .models import User, Profile


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('bio', 'location', 'avatar', 'social_telegram', 'social_vk')
        # Указываем, что аватар не обязателен при обновлении
        extra_kwargs = {
            'avatar': {'required': False}
        }


class ProfileSerializer(serializers.ModelSerializer):
    """Сериализатор только для чтения профиля."""

    class Meta:
        model = Profile
        # 'user' исключаем, чтобы не было рекурсии
        exclude = ('user',)


class UserSerializer(serializers.ModelSerializer):
    """Базовый сериализатор для списков и краткой информации."""
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile')


# --- НОВЫЙ СЕРИАЛИЗАТОР ДЛЯ ОБНОВЛЕНИЯ ПОЛЬЗОВАТЕЛЯ И ЕГО ПРОФИЛЯ ---
class UserUpdateSerializer(serializers.ModelSerializer):
    profile = ProfileUpdateSerializer()

    class Meta:
        model = User
        # Мы разрешаем менять username, email и вложенный профиль
        fields = ('username', 'email', 'profile')

    def update(self, instance, validated_data):
        # Извлекаем данные для вложенного профиля
        profile_data = validated_data.pop('profile', {})
        profile = instance.profile

        # Обновляем поля самой модели User
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        # Обновляем поля модели Profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    """Расширенный сериализатор для детального просмотра профиля."""
    profile = ProfileSerializer(read_only=True)
    schemes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'date_joined', 'profile', 'schemes')

    def get_schemes(self, obj):
        """Возвращает список только ПУБЛИЧНЫХ схем пользователя."""
        from api.serializers import EmbroiderySchemeListSerializer
        public_schemes = obj.schemes.filter(visibility='PUB')
        request = self.context.get('request')
        serializer = EmbroiderySchemeListSerializer(public_schemes, many=True, context={'request': request})
        return serializer.data