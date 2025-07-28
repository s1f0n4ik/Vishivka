# backend/api/serializers.py
from users.serializers import UserSerializer
from rest_framework import serializers
from .models import License, Category, Tag, EmbroideryScheme, SchemeFile, SchemeImage, Comment


class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = License
        fields = '__all__'


# class CategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Category
#         fields = '__all__'
#
#
# class TagSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Tag
#         fields = ('id', 'name', 'slug')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name')


class SchemeImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchemeImage
        fields = ('id', 'image', 'caption')


# --- СЕРИАЛИЗАТОРЫ ДЛЯ ЧТЕНИЯ ДАННЫХ ---

# Сериализатор для СПИСКА схем (краткая информация)
class EmbroiderySchemeListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = serializers.StringRelatedField()
    tags = serializers.StringRelatedField(many=True)
    is_favorited = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()

    class Meta:
        model = EmbroideryScheme
        fields = (
            'id', 'title', 'main_image', 'author', 'category', 'tags', 'difficulty', 'views_count',
            'created_at', 'is_favorited', 'favorites_count'
        )

    def get_is_favorited(self, obj):
        """Проверяет, добавлена ли схема в избранное у текущего пользователя."""
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.favorited_by.filter(id=user.id).exists()
        return False

    def get_favorites_count(self, obj):
        """Возвращает количество пользователей, добавивших схему в избранное."""
        return obj.favorited_by.count()


class SchemeFileSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(source='file')

    class Meta:
        model = SchemeFile
        fields = ('id', 'file_url', 'description', 'get_file_type_display', 'downloads_count')


# Сериализатор для ДЕТАЛЬНОЙ страницы схемы (полная информация)
class EmbroiderySchemeDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    license = LicenseSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    files = SchemeFileSerializer(many=True, read_only=True)
    images = SchemeImageSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()

    class Meta:
        model = EmbroideryScheme
        fields = (
            'id', 'title', 'author', 'description', 'main_image', 'category',
            'tags', 'license', 'difficulty', 'visibility', 'created_at',
            'views_count', 'files', 'images',
            'is_favorited', 'favorites_count'
        )

    def get_is_favorited(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.favorited_by.filter(id=user.id).exists()
        return False

    def get_favorites_count(self, obj):
        return obj.favorited_by.count()


# --- СЕРИАЛИЗАТОРЫ ДЛЯ ЗАПИСИ ДАННЫХ ---

class EmbroiderySchemeCreateSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )
    tags_str = serializers.CharField(write_only=True, required=False, allow_blank=True, label="Теги (через запятую)")
    main_image = serializers.ImageField(write_only=True, required=True)
    file_scheme = serializers.FileField(write_only=True, required=True, label="Файл схемы")

    class Meta:
        model = EmbroideryScheme
        fields = (
            'id', 'title', 'description', 'main_image',
            'category', 'tags_str', 'difficulty', 'visibility',
            'file_scheme'
        )

    def create(self, validated_data):
        tags_string = validated_data.pop('tags_str', '')
        scheme_file_data = validated_data.pop('file_scheme', None)
        scheme = EmbroideryScheme.objects.create(**validated_data)

        if tags_string:
            tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
            tags_to_add = []
            for name in tag_names:
                tag, _ = Tag.objects.get_or_create(name=name)
                tags_to_add.append(tag)
            scheme.tags.set(tags_to_add)

        if scheme_file_data:
            SchemeFile.objects.create(scheme=scheme, file=scheme_file_data)

        return scheme


# Сериализатор для ОБНОВЛЕНИЯ схемы
class EmbroiderySchemeUpdateSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )
    tags_str = serializers.CharField(write_only=True, required=False, allow_blank=True, label="Теги (через запятую)")
    main_image = serializers.ImageField(write_only=True, required=False)
    file_scheme = serializers.FileField(write_only=True, required=False, label="Файл схемы")

    class Meta:
        model = EmbroideryScheme
        fields = (
            'id', 'title', 'description', 'main_image',
            'category', 'tags_str', 'difficulty', 'visibility',
            'file_scheme'
        )

    def update(self, instance, validated_data):
        tags_string = validated_data.pop('tags_str', None)
        scheme_file_data = validated_data.pop('file_scheme', None)

        if tags_string is not None:
            instance.tags.clear()
            tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
            for name in tag_names:
                tag, _ = Tag.objects.get_or_create(name=name)
                instance.tags.add(tag)

        if scheme_file_data:
            SchemeFile.objects.create(scheme=instance, file=scheme_file_data, description="Обновленный файл")

        return super().update(instance, validated_data)


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'author', 'text', 'created_at')
        read_only_fields = ('scheme',)
