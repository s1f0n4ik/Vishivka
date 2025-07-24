from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        if not username:
            raise ValueError(_('The Username field must be set'))

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(_('username'), max_length=150, unique=True)

    # Дополнительные поля, которые мы обсуждали
    # avatar = models.ImageField(_('avatar'), upload_to='avatars/', null=True, blank=True)
    # bio = models.TextField(_('biography'), blank=True)
    # Пока закомментируем поля, чтобы не усложнять первые миграции.
    # Мы добавим их позже, когда будем настраивать Profile или расширять User.

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)  # По умолчанию активен
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'  # Используем email для входа
    REQUIRED_FIELDS = ['username']  # Поля, запрашиваемые при создании суперпользователя через createsuperuser

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name=_('user')
    )
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(_('about me'), blank=True)
    location = models.CharField(_('location'), max_length=100, blank=True)
    # Для социальных сетей можно использовать JSONField (в PostgreSQL) для гибкости
    # или просто несколько полей CharField/URLField
    social_telegram = models.CharField(_('telegram username'), max_length=150, blank=True)
    social_vk = models.CharField(_('VK profile URL'), max_length=255, blank=True)

    # Добавь другие соцсети по аналогии, если нужно

    def __str__(self):
        return f"Profile of {self.user.username}"

    class Meta:
        verbose_name = _('profile')
        verbose_name_plural = _('profiles')