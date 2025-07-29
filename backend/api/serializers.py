# backend/api/serializers.py
from users.serializers import UserSerializer
from rest_framework import serializers
from .models import License, Category, Tag, EmbroideryScheme, SchemeFile, SchemeImage, Comment, Like
from django.utils.text import slugify


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
    is_liked = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = EmbroideryScheme
        fields = (
            'id', 'title', 'main_image', 'author', 'category', 'tags', 'difficulty', 'views_count',
            'created_at', 'is_favorited', 'favorites_count', 'is_liked', 'likes_count'
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

    def get_is_liked(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and Like.objects.filter(scheme=obj, user=user).exists()

    def get_likes_count(self, obj):
        return obj.likes.count()


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
        fields = EmbroiderySchemeListSerializer.Meta.fields + (
            'description', 'license', 'visibility', 'files', 'images'
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

    license = serializers.PrimaryKeyRelatedField(
        queryset=License.objects.all(),
        label="Лицензия"
    )

    tags_str = serializers.CharField(write_only=True, required=False, allow_blank=True, label="Теги (через запятую)")
    main_image = serializers.ImageField(write_only=True, required=True)
    file_scheme = serializers.FileField(write_only=True, required=True, label="Файл схемы")

    gallery_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = EmbroideryScheme
        fields = (
            'id', 'title', 'description', 'main_image',
            'category', 'tags_str', 'difficulty', 'visibility',
            'file_scheme', 'license', 'gallery_images'
        )

    def create(self, validated_data):
        tags_string = validated_data.pop('tags_str', '')
        scheme_file_data = validated_data.pop('file_scheme', None)
        scheme = EmbroideryScheme.objects.create(**validated_data)
        gallery_images_data = validated_data.pop('gallery_images', [])

        if tags_string:
            tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
            tags_to_add = []
            for name in tag_names:
                slug = slugify(name)
                tag, _ = Tag.objects.get_or_create(
                    slug=slug,
                    defaults={'name': name}
                )
                tags_to_add.append(tag)
            scheme.tags.set(tags_to_add)

        if scheme_file_data:
            SchemeFile.objects.create(scheme=scheme, file=scheme_file_data)

        if gallery_images_data:
            for image_data in gallery_images_data:
                SchemeImage.objects.create(scheme=scheme, image=image_data)

        return scheme


# Сериализатор для ОБНОВЛЕНИЯ схемы
class EmbroiderySchemeUpdateSerializer(EmbroiderySchemeCreateSerializer):
    main_image = serializers.ImageField(write_only=True, required=False)
    file_scheme = serializers.FileField(write_only=True, required=False, label="Загрузить новый файл схемы")

    def update(self, instance, validated_data):
        tags_string = validated_data.pop('tags_str', None)
        scheme_file_data = validated_data.pop('file_scheme', None)
        gallery_images_data = validated_data.pop('gallery_images', None)

        instance = super(serializers.ModelSerializer, self).update(instance, validated_data)

        if tags_string is not None:
            instance.tags.clear()
            tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
            for name in tag_names:
                slug = slugify(name); tag, _ = Tag.objects.get_or_create(slug=slug, defaults={'name': name}); instance.tags.add(tag)

        if scheme_file_data:
            SchemeFile.objects.create(scheme=instance, file=scheme_file_data, description="Обновленный файл")

        if gallery_images_data is not None:
            # Здесь можно добавить логику удаления старых картинок, если нужно
            # instance.images.all().delete()
            for image_data in gallery_images_data:
                SchemeImage.objects.create(scheme=instance, image=image_data, caption="Дополнительное изображение")

        return instance


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'author', 'text', 'created_at')
        read_only_fields = ('scheme',)
