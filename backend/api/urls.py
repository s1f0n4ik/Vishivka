# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LicenseViewSet,
    CategoryViewSet,
    TagViewSet,
    EmbroiderySchemeViewSet
)

router_v1 = DefaultRouter()

router_v1.register(r'licenses', LicenseViewSet, basename='licenses')
router_v1.register(r'categories', CategoryViewSet, basename='categories')
router_v1.register(r'tags', TagViewSet, basename='tags')
router_v1.register(r'schemes', EmbroiderySchemeViewSet, basename='schemes')



urlpatterns = [
    path('', include(router_v1.urls)),
]
