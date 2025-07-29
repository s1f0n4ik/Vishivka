# backend/api/migrations/000X_populate_licenses.py

from django.db import migrations

# Список каноничных лицензий Creative Commons
LICENSES_DATA = [
    {
        "name": "Attribution (CC BY)",
        "short_name": "CC BY",
        "url": "https://creativecommons.org/licenses/by/4.0/",
        "description": "Позволяет другим распространять, перерабатывать, исправлять и развивать произведение, даже в коммерческих целях, при условии указания авторства.",
    },
    {
        "name": "Attribution-ShareAlike (CC BY-SA)",
        "short_name": "CC BY-SA",
        "url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "description": "Позволяет другим перерабатывать и развивать произведение даже в коммерческих целях, при условии указания авторства и лицензирования производных работ на тех же условиях.",
    },
    {
        "name": "Attribution-NoDerivs (CC BY-ND)",
        "short_name": "CC BY-ND",
        "url": "https://creativecommons.org/licenses/by-nd/4.0/",
        "description": "Позволяет другим повторно использовать произведение в любых целях, включая коммерческие; однако оно не может быть изменено, и авторство должно быть указано.",
    },
    {
        "name": "Attribution-NonCommercial (CC BY-NC)",
        "short_name": "CC BY-NC",
        "url": "https://creativecommons.org/licenses/by-nc/4.0/",
        "description": "Позволяет другим перерабатывать и развивать произведение в некоммерческих целях. Производные работы не обязаны лицензироваться на тех же условиях.",
    },
    {
        "name": "Attribution-NonCommercial-ShareAlike (CC BY-NC-SA)",
        "short_name": "CC BY-NC-SA",
        "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
        "description": "Позволяет другим перерабатывать и развивать произведение в некоммерческих целях при условии указания авторства и лицензирования производных работ на тех же условиях.",
    },
    {
        "name": "Attribution-NonCommercial-NoDerivs (CC BY-NC-ND)",
        "short_name": "CC BY-NC-ND",
        "url": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
        "description": "Самая строгая лицензия, разрешающая другим только загружать произведения и делиться ими с другими, при условии указания авторства, но они не могут изменять их каким-либо образом или использовать в коммерческих целях.",
    },
    {
        "name": "Public Domain Dedication (CC0)",
        "short_name": "CC0",
        "url": "https://creativecommons.org/publicdomain/zero/1.0/",
        "description": "Автор отказывается от всех своих авторских прав на произведение, передавая его в общественное достояние.",
    },
]

def create_licenses(apps, schema_editor):
    """
    Создает или обновляет записи о лицензиях в базе данных.
    """
    License = apps.get_model('api', 'License')
    for license_data in LICENSES_DATA:
        # Используем update_or_create, чтобы избежать дубликатов при повторном запуске миграции.
        # short_name - уникальный ключ, по которому ищем запись.
        License.objects.update_or_create(
            short_name=license_data['short_name'],
            defaults=license_data
        )

def remove_licenses(apps, schema_editor):
    """
    Откат миграции: удаляет созданные лицензии.
    """
    License = apps.get_model('api', 'License')
    short_names_to_delete = [data['short_name'] for data in LICENSES_DATA]
    License.objects.filter(short_name__in=short_names_to_delete).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'), # <-- Убедитесь, что здесь ваша предыдущая миграция
    ]

    operations = [
        migrations.RunPython(create_licenses, reverse_code=remove_licenses),
    ]