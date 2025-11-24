from django import forms
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.utils.safestring import mark_safe
from django.forms import ModelForm

from .models.user_models import User
from .models.group_models import Group, GroupMember
from .models.thesis_models import Thesis
from .models.document_models import Document
from .models.schedule_models import OralDefenseSchedule
from .models.notification_models import Notification

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('role', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2', 'role')}),
    )

class GroupMemberInline(admin.TabularInline):
    model = GroupMember
    extra = 1
    fields = ('user', 'role_in_group', 'created_at')
    readonly_fields = ('created_at',)
    show_change_link = True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True


class GroupMemberAddForm(forms.ModelForm):
    users = forms.ModelMultipleChoiceField(
        queryset=User.objects.filter(role='STUDENT'),
        required=False,
        widget=admin.widgets.FilteredSelectMultiple('Users', False)
    )
    
    class Meta:
        model = Group
        fields = []


class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'adviser', 'member_count', 'created_at', 'view_members_link')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'members__first_name', 'members__last_name', 'members__email')
    inlines = [GroupMemberInline]
    filter_horizontal = ('panels',)
    change_form_template = 'admin/api/group/change_form.html'
    
    def get_form(self, request, obj=None, **kwargs):
        if obj:  # For change form
            self.fields = ('name', 'adviser', 'panels', 'status')
        else:  # For add form
            self.fields = ('name', 'adviser', 'panels', 'status')
        return super().get_form(request, obj, **kwargs)
        
    def view_members_link(self, obj):
        count = obj.members.count()
        url = reverse('admin:api_groupmember_changelist') + f'?group__id__exact={obj.id}'
        return format_html('<a href="{}">{} Members</a>', url, count)
    view_members_link.short_description = 'Members'
    view_members_link.allow_tags = True

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Total Members'
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('members')
        
    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        group = self.get_object(request, object_id)
        extra_context['show_add_member'] = True
        extra_context['available_students'] = User.objects.filter(
            role='STUDENT'
        ).exclude(
            id__in=group.members.values_list('id', flat=True)
        ).order_by('last_name', 'first_name')
        return super().change_view(request, object_id, form_url, extra_context=extra_context)
        
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/add-members/',
                self.admin_site.admin_view(self.add_members),
                name='api_group_add_members',
            ),
        ]
        return custom_urls + urls
        
    def add_members(self, request, object_id):
        if request.method == 'POST':
            group = self.get_object(request, object_id)
            user_ids = request.POST.getlist('users')
            for user_id in user_ids:
                user = User.objects.get(id=user_id)
                GroupMember.objects.get_or_create(group=group, user=user)
            self.message_user(request, f"Successfully added {len(user_ids)} members to the group.")
            return HttpResponseRedirect('..')
        return HttpResponseRedirect('..')
        
    def response_change(self, request, obj):
        if "_add_members" in request.POST:
            user_ids = request.POST.getlist('users')
            for user_id in user_ids:
                user = User.objects.get(id=user_id)
                GroupMember.objects.get_or_create(group=obj, user=user)
            self.message_user(request, f"Successfully added {len(user_ids)} members to the group.")
            return HttpResponseRedirect('.')
        return super().response_change(request, obj)
        
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, GroupMember) and not instance.pk and not instance.group_id:
                instance.group = form.instance
            instance.save()
        formset.save_m2m()
    
    def response_change(self, request, obj):
        if "_add_members" in request.POST:
            user_ids = request.POST.getlist('users')
            for user_id in user_ids:
                user = User.objects.get(id=user_id)
                GroupMember.objects.get_or_create(group=obj, user=user)
            self.message_user(request, f"Successfully added {len(user_ids)} members to the group.")
            return HttpResponseRedirect('.')
        return super().response_change(request, obj)

class ThesisAdmin(admin.ModelAdmin):
    list_display = ('title', 'group', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('title', 'group__name')
    date_hierarchy = 'created_at'

class DocumentAdmin(admin.ModelAdmin):
    list_display = ('thesis', 'uploaded_by', 'document_type', 'created_at')
    list_filter = ('document_type', 'created_at')
    search_fields = ('thesis__title', 'uploaded_by__email')
    date_hierarchy = 'created_at'

class DefenseScheduleAdmin(admin.ModelAdmin):
    list_display = ('thesis', 'start', 'end', 'location', 'created_at')
    list_filter = ('start', 'created_at')
    search_fields = ('thesis__title', 'location')
    date_hierarchy = 'start'

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('title', 'message', 'recipient__email')
    date_hierarchy = 'created_at'

class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ('group', 'user', 'role_in_group', 'created_at')
    list_filter = ('role_in_group', 'created_at')
    search_fields = ('group__name', 'user__email', 'user__first_name', 'user__last_name')
    date_hierarchy = 'created_at'

# Register models
admin.site.register(User, UserAdmin)
admin.site.register(Group, GroupAdmin)
admin.site.register(GroupMember, GroupMemberAdmin)
admin.site.register(Thesis, ThesisAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(OralDefenseSchedule, DefenseScheduleAdmin)
admin.site.register(Notification, NotificationAdmin)