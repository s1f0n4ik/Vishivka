# api/views.py
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action
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
        if self.action == 'my':
            return EmbroiderySchemeListSerializer
        return EmbroiderySchemeDetailSerializer

    def get_queryset(self):
        """
        Этот метод определяет, какие объекты показывать.
        Для общего списка ('list') мы показываем только публичные схемы.
        """
        # Эта логика теперь будет работать правильно, т.к. мы будем создавать публичные схемы
        if self.action == 'list':
            return EmbroideryScheme.objects.filter(visibility='PUB').order_by('-created_at')
        return EmbroideryScheme.objects.all().order_by('-created_at')

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my(self, request):
        """
        Возвращает список схем, принадлежащих текущему пользователю.
        """
        user_schemes = self.get_queryset().filter(author=request.user)

        serializer = self.get_serializer(user_schemes, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        # Принудительно устанавливаем видимость "public" для всех новых схем
        default_license = License.objects.first()
        serializer.save(
            author=self.request.user,
            license=default_license,
            visibility='PUB'  # <--- ДОБАВЬТЕ ЭТУ СТРОКУ
        )
