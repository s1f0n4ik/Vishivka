# backend/users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile
from .forms import CustomUserCreationForm, CustomUserChangeForm


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    inlines = (ProfileInline,)
    list_display = ('email', 'username', 'is_staff', 'is_active')
    search_fields = ('email', 'username')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super().get_inline_instances(request, obj)

    # !!! НАЧАЛО ДИАГНОСТИЧЕСКОГО КОДА !!!
    # Этот код перехватывает ошибку и выводит ее в консоль
    def add_view(self, request, form_url="", extra_context=None):
        if request.method == 'POST':
            form = self.add_form(request.POST, request.FILES)
            if not form.is_valid():
                print("=" * 50)
                print("ОШИБКА ВАЛИДАЦИИ ФОРМЫ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ:")
                print(form.errors.as_json(escape_html=True))
                print("=" * 50)
        return super().add_view(request, form_url, extra_context)
    # !!! КОНЕЦ ДИАГНОСТИЧЕСКОГО КОДА !!!