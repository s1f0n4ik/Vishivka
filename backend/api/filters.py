# backend/api/filters.py

from django_filters import rest_framework as filters
from .models import EmbroideryScheme

class SchemeFilter(filters.FilterSet):
    """
    Кастомный набор фильтров для модели EmbroideryScheme.
    """
    search = filters.CharFilter(field_name='title', lookup_expr='icontains')
    license = filters.NumberFilter(field_name='license__id')
    tags = filters.CharFilter(method='filter_by_tags_name', label='Filter by tag names (comma-separated)')

    # --- НАЧАЛО ИЗМЕНЕНИЙ ---

    # Явно указываем, как фильтровать по сложности.
    # Фронтенд шлет 'easy', 'medium', 'hard'. Мы их сопоставляем с ключами из модели ('EA', 'ME', 'HA').
    difficulty = filters.ChoiceFilter(
        choices=(
            ('easy', 'Easy'),
            ('medium', 'Medium'),
            ('hard', 'Hard'),
            ('expert', 'Expert'),
        ),
        # Наш метод-конвертер
        method='filter_by_difficulty_value'
    )

    class Meta:
        model = EmbroideryScheme
        # 'difficulty' теперь определен выше, так что его можно оставить или убрать из fields.
        # Для ясности оставим, но django-filter будет использовать наше кастомное определение.
        fields = ['category', 'difficulty', 'license', 'search', 'tags']

    def filter_by_tags_name(self, queryset, name, value):
        tag_names = [tag.strip() for tag in value.split(',') if tag.strip()]
        if not tag_names:
            return queryset
        return queryset.filter(tags__name__in=tag_names).distinct()

    def filter_by_difficulty_value(self, queryset, name, value):
        """
        Конвертирует 'easy' -> 'EA', 'medium' -> 'ME' и т.д.
        """
        # Словарь для сопоставления
        difficulty_map = {
            'easy': 'EA',
            'medium': 'ME',
            'hard': 'HA',
            'expert': 'EX'
        }
        # Получаем код для БД, например, 'ME'
        db_value = difficulty_map.get(value)
        if db_value:
            # Если значение найдено, фильтруем queryset
            return queryset.filter(difficulty=db_value)
        # Если пришло что-то непонятное, просто возвращаем исходный queryset
        return queryset

    # --- КОНЕЦ ИЗМЕНЕНИЙ ---