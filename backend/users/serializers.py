# users/serializers.py
from rest_framework import serializers
from .models import User, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        # Исключаем связь с пользователем, чтобы не было циклической зависимости,
        # так как профиль будет вложен в пользователя
        exclude = ('user',)


class UserSerializer(serializers.ModelSerializer):
    # Вкладываем сериализатор профиля, чтобы данные профиля были частью данных пользователя
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile')  # Указываем нужные поля
        # Мы не включаем 'password', так как его хеш никогда не должен утекать через API
