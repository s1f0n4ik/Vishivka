# api/serializers.py
from users.serializers import UserSerializer
from rest_framework import serializers
from .models import License, Category, Tag, EmbroideryScheme, SchemeFile, SchemeImage


class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = License
        fields = '__all__'  # Включаем все поля модели


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug')  # Можно перечислить поля явно


# ... (код для License, Category, Tag) ...

class SchemeFileSerializer(serializers.ModelSerializer):
    # file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)

    class Meta:
        model = SchemeFile
        fields = ('id', 'file', 'description', 'file_type', 'downloads_count')
        read_only_fields = ('downloads_count',)


class SchemeImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchemeImage
        fields = ('id', 'image', 'caption')


# Сериализатор для СПИСКА схем (краткая информация)
class EmbroiderySchemeListSerializer(serializers.ModelSerializer):
    # Вместо ID автора показываем его имя пользователя
    author = serializers.StringRelatedField()
    # Вместо ID категории показываем ее название
    category = serializers.StringRelatedField()
    # Вместо ID тегов показываем их названия
    tags = serializers.StringRelatedField(many=True)

    class Meta:
        model = EmbroideryScheme
        fields = (
            'id',
            'title',
            'main_image',
            'author',
            'category',
            'tags',
            'difficulty',
            'views_count',
            'created_at'
        )


# Сериализатор для ДЕТАЛЬНОЙ страницы схемы (полная информация)
class EmbroiderySchemeDetailSerializer(serializers.ModelSerializer):
    # Показываем полную информацию об авторе, используя UserSerializer
    author = UserSerializer(read_only=True)
    # Показываем полную информацию о категории
    category = CategorySerializer(read_only=True)
    # Показываем полную информацию о лицензии
    license = LicenseSerializer(read_only=True)
    # Показываем полную информацию о тегах
    tags = TagSerializer(many=True, read_only=True)

    # Вкладываем список файлов, используя их сериализатор
    files = SchemeFileSerializer(many=True, read_only=True)
    # Вкладываем галерею изображений
    images = SchemeImageSerializer(many=True, read_only=True)

    class Meta:
        model = EmbroideryScheme
        fields = '__all__' # Здесь нам нужны все поля модели