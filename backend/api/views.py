# api/views.py
from rest_framework import viewsets, permissions
from .models import License, Category, Tag, EmbroideryScheme
from .serializers import (
    LicenseSerializer,
    CategorySerializer,
    TagSerializer,
    EmbroiderySchemeListSerializer,
    EmbroiderySchemeDetailSerializer
)


class LicenseViewSet(viewsets.ModelViewSet):
    """
    API endpoint для просмотра и редактирования лицензий.
    """
    queryset = License.objects.all()
    serializer_class = LicenseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Читать могут все, менять - только авторизованные


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint для просмотра и редактирования категорий.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class TagViewSet(viewsets.ModelViewSet):
    """
    API endpoint для просмотра и редактирования тегов.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class EmbroiderySchemeViewSet(viewsets.ModelViewSet):
    """
        API endpoint для просмотра и редактирования схем вышивки.
    """
    queryset = EmbroideryScheme.objects.filter(visibility=EmbroideryScheme.Visibility.PUBLIC).select_related(
        'author',
        'category'
    ).prefetch_related('tags')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # В будущем добавим более сложные права (автор может редактировать)

    def get_serializer_class(self):
        """
            Выбираем нужный сериализатор в зависимости от действия.
            Для просмотра списка ('list') - краткий, для всего остального - полный.
        """
        if self.action == 'list':
            return EmbroiderySchemeListSerializer
        return EmbroiderySchemeDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        """
            Переопределяем метод для получения одного объекта,
            чтобы добавить логику инкремента счетчика просмотров.
        """
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])  # Обновляем только одно поле в БД для эффективности
        return super().retrieve(request, *args, **kwargs)
