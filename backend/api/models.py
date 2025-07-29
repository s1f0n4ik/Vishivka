from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.db.models import Sum


class License(models.Model):
    name = models.CharField(_('full name'), max_length=255, unique=True)
    short_name = models.CharField(_('short name'), max_length=50, unique=True)
    url = models.URLField(_('URL'), max_length=200, unique=True)
    description = models.TextField(_('description'), blank=True)

    def __str__(self):
        return self.short_name

    class Meta:
        verbose_name = _('license')
        verbose_name_plural = _('licenses')
        ordering = ['name']


class Category(models.Model):
    name = models.CharField(_('name'), max_length=100, unique=True)
    slug = models.SlugField(_('slug'), max_length=100, unique=True,
                                    help_text=_('A short label for URLs, generally a hyphenated version of the name.'))
    description = models.TextField(_('description'), blank=True)

    # parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.SET_NULL, verbose_name=_('parent category')) # Для вложенных категорий, если понадобится

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _('category')
        verbose_name_plural = _('categories')
        ordering = ['name']


class Tag(models.Model):
    name = models.CharField(_('name'), max_length=100, unique=True)
    slug = models.SlugField(
        _('slug'),
        max_length=100,
        unique=True,
        help_text=_('A short label for URLs, generally a hyphenated version of the name.')
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _('tag')
        verbose_name_plural = _('tags')
        ordering = ['name']


class EmbroideryScheme(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'EA', _('Easy')
        MEDIUM = 'ME', _('Medium')
        HARD = 'HA', _('Hard')
        EXPERT = 'EX', _('Expert')

    class Visibility(models.TextChoices):
        PUBLIC = 'PUB', _('Public')
        UNLISTED = 'UNL', _('Unlisted')  # Доступ по прямой ссылке
        PRIVATE = 'PRI', _('Private')  # Только для автора

    title = models.CharField(_('title'), max_length=200)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        # Если пользователь удален, его схемы тоже (или models.SET_NULL, если схемы должны оставаться)
        related_name='schemes',
        verbose_name=_('author')
    )
    favorited_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='favorite_schemes',
        blank=True,  # Может быть пустым
        verbose_name='В избранном у'
    )
    description = models.TextField(_('description'), blank=True)

    # Для основного изображения/превью. Загрузка в 'schemes/main_images/YYYY/MM/DD/'
    main_image = models.ImageField(
        _('main image'),
        upload_to='schemes/main_images/%Y/%m/%d/',
        null=True, blank=True  # Может быть добавлено позже
    )

    category = models.ForeignKey(
        Category,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='schemes',
        verbose_name=_('category')
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='schemes',
        verbose_name=_('tags')
    )
    license = models.ForeignKey(
        License,
        on_delete=models.PROTECT,  # Защита от удаления лицензии, если она используется
        related_name='schemes',
        verbose_name=_('license')
    )

    difficulty = models.CharField(
        _('difficulty'),
        max_length=2,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM
    )

    # Размеры и цвета (опциональные)
    size_stitches_width = models.PositiveIntegerField(_('width in stitches'), null=True, blank=True)
    size_stitches_height = models.PositiveIntegerField(_('height in stitches'), null=True, blank=True)
    number_of_colors = models.PositiveIntegerField(_('number of colors'), null=True, blank=True)

    recommended_canvas = models.CharField(_('recommended canvas'), max_length=255, blank=True)
    recommended_threads = models.CharField(_('recommended threads'), max_length=255,
                                            blank=True)
    # Может быть, в будущем это будет ссылка на другую модель или структурированное поле

    visibility = models.CharField(
        _('visibility'),
        max_length=3,
        choices=Visibility.choices,
        default=Visibility.PUBLIC
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    views_count = models.PositiveIntegerField(_('views count'), default=0, editable=False)

    # downloads_count = models.PositiveIntegerField(_('downloads count'), default=0, editable=False) # Добавим, когда будут файлы

    # slug = models.SlugField(_('slug'), max_length=250, unique=True, blank=True) # Если нужен уникальный слаг для схемы

    @property
    def total_downloads_count(self):
        """Возвращает сумму скачиваний всех файлов, связанных с этой схемой."""
        # Мы используем aggregate для эффективного подсчета на уровне БД.
        # Если файлов нет, вернется None, поэтому мы обрабатываем этот случай.
        result = self.files.aggregate(total=Sum('downloads_count'))
        return result['total'] or 0

    def __str__(self):
        return self.title

    # def save(self, *args, **kwargs):
    #     if not self.slug: # Пример авто-генерации слага
    #         self.slug = slugify(f"{self.title}-{self.author.username}") # Нужна уникальность
    #     super().save(*args, **kwargs)

    class Meta:
        verbose_name = _('embroidery scheme')
        verbose_name_plural = _('embroidery schemes')
        ordering = ['-created_at']  # По умолчанию сортируем по дате создания (новые сверху)


class Like(models.Model):
    """Модель для хранения лайков от пользователей к схемам."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes',
        verbose_name=_('user')
    )
    scheme = models.ForeignKey(
        EmbroideryScheme,
        on_delete=models.CASCADE,
        related_name='likes',
        verbose_name=_('scheme')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('like')
        verbose_name_plural = _('likes')
        # Гарантирует, что один пользователь может поставить только один лайк одной схеме
        unique_together = ('user', 'scheme')
        ordering = ['-created_at']

    def __str__(self):
        return f"Like by {self.user} on {self.scheme}"


class SchemeFile(models.Model):
    class FileType(models.TextChoices):
        PDF = 'PDF', _('PDF Document')
        XSD = 'XSD', _('Pattern Maker File')
        SAGA = 'SAGA', _('Cross Stitch Saga File')
        IMAGE = 'IMG', _('Image (PNG/JPG)')
        OTHER = 'OTH', _('Other')

    scheme = models.ForeignKey(
        EmbroideryScheme,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name=_('embroidery scheme')
    )
    file = models.FileField(
         _('file'),
        upload_to='schemes/files/%Y/%m/%d/'  # Файлы будут храниться отдельно от изображений
    )
    description = models.CharField(_('description'), max_length=255, blank=True)
    file_type = models.CharField(
        _('file type'),
        max_length=4,
        choices=FileType.choices,
        default=FileType.OTHER
    )
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    downloads_count = models.PositiveIntegerField(_('downloads count'), default=0, editable=False)

    def __str__(self):
        # self.file.name вернет путь к файлу, например 'schemes/files/2025/05/17/my_scheme.pdf'
        return f"File for {self.scheme.title} ({self.get_file_type_display()})"

    class Meta:
        verbose_name = _('scheme file')
        verbose_name_plural = _('scheme files')
        ordering = ['-uploaded_at']


class SchemeImage(models.Model):
    scheme = models.ForeignKey(
        EmbroideryScheme,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('embroidery scheme')
    )
    image = models.ImageField(
        _('image'),
        upload_to='schemes/gallery/%Y/%m/%d/'
    )
    caption = models.CharField(_('caption'), max_length=255, blank=True)
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)

    def __str__(self):
        return f"Image for {self.scheme.title}"

    class Meta:
        verbose_name = _('scheme image')
        verbose_name_plural = _('scheme images')
        ordering = ['-uploaded_at']


class Comment(models.Model):
    """Модель для комментариев к схемам."""
    scheme = models.ForeignKey(
        EmbroideryScheme,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('embroidery scheme')
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('author')
    )
    text = models.TextField(_('text'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    def __str__(self):
        return f'Comment by {self.author} on {self.scheme}'

    class Meta:
        verbose_name = _('comment')
        verbose_name_plural = _('comments')
        ordering = ['created_at'] # Старые комментарии сверху