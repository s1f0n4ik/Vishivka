from django.contrib import admin
from .models import License, Category, Tag, EmbroideryScheme, SchemeFile, SchemeImage


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ('short_name', 'name', 'url')
    search_fields = ('short_name', 'name')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


class SchemeFileInline(admin.TabularInline):
    model = SchemeFile
    extra = 1  # это кол-во пустых форм для добавл. файлов
    fields = ('file', 'file_type', 'description', 'downloads_count')
    readonly_fields = ('downloads_count',)


class SchemeImageInline(admin.TabularInline):
    model = SchemeImage
    extra = 1
    fields = ('image', 'caption')
    # readonly_fields = ('image_preview',)  # превью, если нужно


@admin.register(EmbroideryScheme)
class EmbroiderySchemeAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'license', 'difficulty', 'visibility', 'created_at', 'views_count')
    list_filter = ('category', 'license', 'difficulty', 'visibility', 'created_at', 'author')
    search_fields = ('title', 'description', 'author__username', 'author__email')
    raw_id_fields = ('author', 'category', 'license')  # Удобно для полей ForeignKey с большим количеством записей
    filter_horizontal = ('tags',)  # Удобный виджет для ManyToManyField
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    inlines = [SchemeFileInline, SchemeImageInline]

# Пока не работает, хз почему
    # Если бы был slug и мы хотели бы его автозаполнять:
    # prepopulated_fields = {'slug': ('title',)}

    # для лучшей организации полей в форме редактирования
    # fieldsets = (
    #     (None, {
    #         'fields': ('title', 'author', 'main_image', 'description')
    #     }),
    #     ('Details', {
    #         'fields': ('category', 'tags', 'license', 'difficulty', 'visibility')
    #     }),
    #     ('Specifications', {
    #         'fields': (
    #             'size_stitches_width',
    #             'size_stitches_height',
    #             'number_of_colors',
    #             'recommended_canvas',
    #             'recommended_threads'
    #         ),
    #         'classes': ('collapse',),  # Сделать секцию сворачиваемой
    #     }),
    #     ('Stats', {
    #         'fields': ('views_count',),  # 'downloads_count'
    #     }),
    # )
