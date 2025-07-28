# api/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action
from .permissions import IsAuthorOrReadOnly
from .models import License, Category, Tag, EmbroideryScheme, Comment
from .serializers import (
    LicenseSerializer,
    CategorySerializer,
    TagSerializer,
    EmbroiderySchemeListSerializer,
    EmbroiderySchemeDetailSerializer,
    EmbroiderySchemeCreateSerializer,
    EmbroiderySchemeUpdateSerializer,
    CommentSerializer
)
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404


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
    pagination_class = None


class TagViewSet(viewsets.ModelViewSet):
    """
    API endpoint для просмотра и редактирования тегов.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet для комментариев к схемам."""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] #, IsAuthorOrReadOnly] <-- Пока закомментируем права

    def get_queryset(self):
        # Фильтруем комментарии по ID схемы из URL
        scheme_pk = self.kwargs.get('scheme_pk')
        return Comment.objects.filter(scheme_id=scheme_pk)

    def perform_create(self, serializer):
        # При создании комментария автоматически подставляем автора и схему
        scheme_pk = self.kwargs.get('scheme_pk')
        scheme = get_object_or_404(EmbroideryScheme, pk=scheme_pk)
        serializer.save(author=self.request.user, scheme=scheme)


class EmbroiderySchemeViewSet(viewsets.ModelViewSet):
    # queryset = EmbroideryScheme.objects.filter(visibility='public').select_related('author', 'category').prefetch_related('tags')
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)

    # Поля для точной фильтрации (например, ?category=1 или ?tags=3)
    filterset_fields = ('category', 'tags', 'difficulty')

    search_fields = ('title', 'description')

    queryset = EmbroideryScheme.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return EmbroiderySchemeListSerializer
        if self.action == 'create':
            return EmbroiderySchemeCreateSerializer
        if self.action == 'update' or self.action == 'partial_update':
            return EmbroiderySchemeUpdateSerializer
        if self.action == 'my' or self.action == 'favorited':
            return EmbroiderySchemeListSerializer
        return EmbroiderySchemeDetailSerializer

    @action(
        detail=True,  # Действие для конкретного объекта (схемы)
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated]  # Только для авторизованных
    )
    def favorite(self, request, pk=None):
        """Добавляет или удаляет схему из избранного текущего пользователя."""
        scheme = self.get_object()
        user = request.user

        if user in scheme.favorited_by.all():
            # Если уже в избранном - удаляем
            scheme.favorited_by.remove(user)
            return Response({'status': 'removed from favorites'}, status=status.HTTP_200_OK)
        else:
            # Если нет в избранном - добавляем
            scheme.favorited_by.add(user)
            return Response({'status': 'added to favorites'}, status=status.HTTP_200_OK)

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
    def favorited(self, request):
        """
        Возвращает список схем, добавленных текущим пользователем в избранное.
        """
        # queryset = self.get_queryset().filter(favorited_by=request.user) # Это почти правильно, но get_queryset уже фильтрует по 'PUB', а мы хотим видеть все свои избранные
        # Правильный вариант - напрямую из модели
        favorited_schemes = EmbroideryScheme.objects.filter(favorited_by=request.user)

        # Пагинация
        page = self.paginate_queryset(favorited_schemes)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(favorited_schemes, many=True)
        return Response(serializer.data)

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
