# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Наши API эндпоинты
    path('api/v1/', include('api.urls')),

    # Эндпоинты для управления пользователями (регистрация, логин и т.д.)
    # Это создаст URL'ы типа /api/v1/auth/users/, /api/v1/auth/jwt/create/ (логин)
    path('api/v1/auth/', include('djoser.urls')),
    path('api/v1/auth/', include('djoser.urls.jwt')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)