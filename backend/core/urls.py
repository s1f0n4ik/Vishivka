# core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Подключаем URL'ы из наших приложений с префиксом /api/v1/
    path('api/v1/', include('api.urls')),
    path('api/v1/', include('users.urls')),
]

# Этот блок нужен для того, чтобы в режиме разработки (DEBUG=True)
# Django мог самостоятельно отдавать медиа-файлы (наши картинки, схемы и т.д.)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)