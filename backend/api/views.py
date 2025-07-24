# api/views.py
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .permissions import IsAuthorOrReadOnly
from .models import License, Category, Tag, EmbroideryScheme
from .serializers import (
    LicenseSerializer,
    CategorySerializer,
    TagSerializer,
    EmbroiderySchemeListSerializer,
    EmbroiderySchemeDetailSerializer,
    EmbroiderySchemeCreateSerializer,
    EmbroiderySchemeUpdateSerializer
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
    queryset = EmbroideryScheme.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return EmbroiderySchemeListSerializer
        if self.action == 'create':
            return EmbroiderySchemeCreateSerializer
        if self.action == 'update' or self.action == 'partial_update':
            return EmbroiderySchemeUpdateSerializer
        return EmbroiderySchemeDetailSerializer

    def perform_create(self, serializer):
        # Эта логика остается! Она по-прежнему нужна для автора и лицензии.
        default_license = License.objects.first()
        serializer.save(author=self.request.user, license=default_license)
