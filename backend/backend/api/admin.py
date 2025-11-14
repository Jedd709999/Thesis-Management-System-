from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models.user_models import User
from .models.group_models import Group
from .models.thesis_models import Thesis
from .models.document_models import Document
from .models.schedule_models import DefenseSchedule
from .models.notification_models import Notification

class UserAdmin(BaseUserAdmin):
    list_display = ('email','first_name','last_name','role','is_staff','is_superuser')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email','password')}),
        ('Personal', {'fields': ('first_name','last_name')}),
        ('Permissions', {'fields': ('role','is_staff','is_superuser','groups','user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email','password1','password2','role')}),
    )

class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'adviser', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name',)
    filter_horizontal = ('members', 'panels')

class ThesisAdmin(admin.ModelAdmin):
    list_display = ('title', 'group', 'proposer', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('title', 'group__name', 'proposer__email')
    date_hierarchy = 'created_at'

class DocumentAdmin(admin.ModelAdmin):
    list_display = ('thesis', 'uploaded_by', 'provider', 'created_at')
    list_filter = ('provider', 'created_at')
    search_fields = ('thesis__title', 'uploaded_by__email')
    date_hierarchy = 'created_at'

class DefenseScheduleAdmin(admin.ModelAdmin):
    list_display = ('group', 'start_at', 'end_at', 'location', 'created_at')
    list_filter = ('start_at', 'created_at')
    search_fields = ('group__name', 'location')
    date_hierarchy = 'start_at'

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('title', 'body', 'user__email')
    date_hierarchy = 'created_at'

# Register models
admin.site.register(User, UserAdmin)
admin.site.register(Group, GroupAdmin)
admin.site.register(Thesis, ThesisAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(DefenseSchedule, DefenseScheduleAdmin)
admin.site.register(Notification, NotificationAdmin)
