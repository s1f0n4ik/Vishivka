# api/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action
from .permissions import IsAuthorOrReadOnly
from .models import License, Category, Tag, EmbroideryScheme, Comment, Like
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

from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .filters import SchemeFilter

from .models import License, Category, Tag, EmbroideryScheme, Comment, SchemeFile
from django.db.models import F
from django.http import HttpResponseRedirect


class LicenseViewSet(viewsets.ModelViewSet):
    queryset = License.objects.all()
    serializer_class = LicenseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        scheme_pk = self.kwargs.get('scheme_pk')
        return Comment.objects.filter(scheme_id=scheme_pk)

    def perform_create(self, serializer):
        scheme_pk = self.kwargs.get('scheme_pk')
        scheme = get_object_or_404(EmbroideryScheme, pk=scheme_pk)
        serializer.save(author=self.request.user, scheme=scheme)


class EmbroiderySchemeViewSet(viewsets.ModelViewSet):
    filter_backends = (DjangoFilterBackend,)
    filterset_class = SchemeFilter

    queryset = EmbroideryScheme.objects.select_related(
        'author', 'category', 'license'
    ).prefetch_related(
        'tags', 'files', 'images', 'favorited_by', 'likes'
    ).all().order_by('-created_at')
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

    def get_serializer_context(self):
        # Передаем request в контекст, чтобы сериализаторы имели к нему доступ
        return {'request': self.request}

    def retrieve(self, request, *args, **kwargs):
        """
        Переопределяем метод для получения одного объекта.
        При каждом запросе к детальной странице будем увеличивать счетчик просмотров.
        """
        instance = self.get_object()
        instance.views_count = F('views_count') + 1
        instance.save(update_fields=['views_count'])
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticatedOrReadOnly],
        url_path='download_file/(?P<file_pk>\d+)'
    )
    def download_file(self, request, pk=None, file_pk=None):
        """
        Увеличивает счетчик скачиваний файла и перенаправляет на сам файл.
        """
        scheme = self.get_object()
        file_to_download = get_object_or_404(SchemeFile, pk=file_pk, scheme=scheme)

        # Увеличиваем счетчик скачиваний
        file_to_download.downloads_count = F('downloads_count') + 1
        file_to_download.save(update_fields=['downloads_count'])

        # Перенаправляем пользователя на URL файла
        return HttpResponseRedirect(redirect_to=file_to_download.file.url)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def favorite(self, request, pk=None):
        scheme = self.get_object()
        user = request.user
        if user in scheme.favorited_by.all():
            scheme.favorited_by.remove(user)
            return Response({'status': 'removed from favorites'}, status=status.HTTP_200_OK)
        else:
            scheme.favorited_by.add(user)
            return Response({'status': 'added to favorites'}, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def like(self, request, pk=None):
        """Поставить или убрать лайк."""
        scheme = self.get_object()
        user = request.user
        like, created = Like.objects.get_or_create(user=user, scheme=scheme)

        if not created:
            # Лайк уже существовал, значит, пользователь его снимает
            like.delete()
            return Response({'status': 'unliked'}, status=status.HTTP_200_OK)
        else:
            # Лайк только что создан
            return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        # На `list` мы по-прежнему хотим видеть только публичные схемы
        base_queryset = super().get_queryset()
        if self.action == 'list':
            return base_queryset.filter(visibility='PUB')
        return base_queryset

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def favorited(self, request):
        favorited_schemes = EmbroideryScheme.objects.filter(favorited_by=request.user)
        page = self.paginate_queryset(favorited_schemes)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(favorited_schemes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my(self, request):
        user_schemes = self.get_queryset().filter(author=request.user)
        serializer = self.get_serializer(user_schemes, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)