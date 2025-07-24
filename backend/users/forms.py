# backend/users/forms.py

from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User


class CustomUserCreationForm(UserCreationForm):
    """
    Форма для создания нового пользователя.
    """

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('email', 'username')


class CustomUserChangeForm(UserChangeForm):
    """
    Форма для редактирования существующего пользователя.
    """

    class Meta:
        model = User
        fields = ('email', 'username')