# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LicenseViewSet,
    CategoryViewSet,
    TagViewSet,
    EmbroiderySchemeViewSet,
    CommentViewSet
)
from users.views import UserViewSet
from rest_framework_nested import routers

router_v1 = DefaultRouter()

router_v1.register(r'licenses', LicenseViewSet, basename='licenses')
router_v1.register(r'categories', CategoryViewSet, basename='categories')
router_v1.register(r'tags', TagViewSet, basename='tags')
router_v1.register(r'schemes', EmbroiderySchemeViewSet, basename='schemes')
router_v1.register(r'users', UserViewSet, basename='users')

comments_router = routers.NestedSimpleRouter(router_v1, r'schemes', lookup='scheme')
comments_router.register(r'comments', CommentViewSet, basename='scheme-comments')



urlpatterns = [
    path('', include(router_v1.urls)),
    path('', include(comments_router.urls)),
]
