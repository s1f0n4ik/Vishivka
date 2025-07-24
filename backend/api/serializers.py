# backend/api/serializers.py
from users.serializers import UserSerializer
from rest_framework import serializers
from .models import License, Category, Tag, EmbroideryScheme, SchemeFile, SchemeImage


class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = License
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug')


class SchemeImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchemeImage
        fields = ('id', 'image', 'caption')


# --- СЕРИАЛИЗАТОРЫ ДЛЯ ЧТЕНИЯ ДАННЫХ (ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ) ---

# Сериализатор для СПИСКА схем (краткая информация)
class EmbroiderySchemeListSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    tags = serializers.StringRelatedField(many=True)

    class Meta:
        model = EmbroideryScheme
        fields = ('id', 'title', 'main_image', 'author', 'category', 'tags', 'difficulty', 'views_count', 'created_at')


class SchemeFileSerializer(serializers.ModelSerializer):
    # Чтобы в ответе было не просто название файла, а полный URL для скачивания
    file_url = serializers.FileField(source='file')

    class Meta:
        model = SchemeFile
        # Указываем поля, которые хотим видеть в API
        fields = ('id', 'file_url', 'description', 'get_file_type_display', 'downloads_count')
        # get_file_type_display - это удобный метод Django, который вернет читабельное название типа файла (e.g. "PDF Document")


# Сериализатор для ДЕТАЛЬНОЙ страницы схемы (полная информация)
class EmbroiderySchemeDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    license = LicenseSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    files = SchemeFileSerializer(many=True, read_only=True)
    images = SchemeImageSerializer(many=True, read_only=True)

    files = SchemeFileSerializer(many=True, read_only=True)

    class Meta:
        model = EmbroideryScheme
        # Добавляем 'files' в список полей
        fields = (
            'id', 'title', 'author', 'description', 'main_image', 'category',
            'tags', 'license', 'difficulty', 'visibility', 'created_at',
            'views_count', 'files', 'images'
        )


class EmbroiderySchemeCreateSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )
    tags_str = serializers.CharField(write_only=True, required=False, allow_blank=True, label="Теги (через запятую)")

    # Файлы ОБЯЗАТЕЛЬНЫ при создании
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
        # Логика создания остается точно такой же, как была
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

    # === КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ЗДЕСЬ ===
    # Файлы НЕОБЯЗАТЕЛЬНЫ при обновлении
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
        # Логика обновления остается почти такой же, но добавляем обработку новых файлов
        tags_string = validated_data.pop('tags_str', None)
        scheme_file_data = validated_data.pop('file_scheme', None)

        # Обновляем теги, если они были переданы
        if tags_string is not None:
            instance.tags.clear()
            tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
            for name in tag_names:
                tag, _ = Tag.objects.get_or_create(name=name)
                instance.tags.add(tag)

        # Если пользователь загрузил новый файл схемы, создаем для него объект SchemeFile
        # (в более сложной логике можно было бы заменять старый, но для простоты добавим новый)
        if scheme_file_data:
            SchemeFile.objects.create(scheme=instance, file=scheme_file_data, description="Обновленный файл")

        # Вызываем стандартный метод update для остальных полей (title, description, main_image и т.д.)
        return super().update(instance, validated_data)
