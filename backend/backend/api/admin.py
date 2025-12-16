from django import forms
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.utils.safestring import mark_safe
from django.forms import ModelForm
from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _

from .models.user_models import User
from .models.group_models import Group, GroupMember
from .models.thesis_models import Thesis
from .models.document_models import Document
from .models.schedule_models import OralDefenseSchedule, ApprovalSheet, Evaluation
from .models.notification_models import Notification
from .models.archive_record_models import ArchiveRecord


class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active', 'is_email_verified')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'is_email_verified')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'role')}),
        ('Status', {
            'fields': ('is_active', 'is_email_verified', 'email_verification_sent_at'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'is_active', 'is_staff')
        }),
    )
    readonly_fields = ('email_verification_sent_at', 'last_login', 'date_joined')
    
    def get_search_results(self, request, queryset, search_term):
        try:
            return super().get_search_results(request, queryset, search_term)
        except Exception as e:
            import logging
            logging.error(f"Error in UserAdmin.get_search_results: {e}")
            return super().get_search_results(request, queryset, search_term)

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
        try:
            count = obj.members.count()
            url = reverse('admin:api_groupmember_changelist') + f'?group__id__exact={obj.id}'
            return format_html('<a href="{}">{} Members</a>', url, count)
        except Exception as e:
            return f"Error: {str(e)}"
    view_members_link.short_description = 'Members'
    view_members_link.allow_tags = True

    def member_count(self, obj):
        try:
            return obj.members.count()
        except Exception as e:
            return f"Error: {str(e)}"
    member_count.short_description = 'Total Members'
    
    def get_queryset(self, request):
        try:
            return super().get_queryset(request).prefetch_related('members')
        except Exception as e:
            import logging
            logging.error(f"Error in GroupAdmin.get_queryset: {e}")
            return super().get_queryset(request)
        
    def change_view(self, request, object_id, form_url='', extra_context=None):
        try:
            extra_context = extra_context or {}
            group = self.get_object(request, object_id)
            if group:
                extra_context['show_add_member'] = True
                extra_context['available_students'] = User.objects.filter(
                    role='STUDENT'
                ).exclude(
                    id__in=group.members.values_list('id', flat=True)
                ).order_by('last_name', 'first_name')
            return super().change_view(request, object_id, form_url, extra_context=extra_context)
        except Exception as e:
            import logging
            logging.error(f"Error in GroupAdmin.change_view: {e}")
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
        try:
            if request.method == 'POST':
                group = self.get_object(request, object_id)
                if not group:
                    self.message_user(request, _("Group not found."), messages.ERROR)
                    return HttpResponseRedirect('..')
                    
                user_ids = request.POST.getlist('users')
                added_count = 0
                for user_id in user_ids:
                    try:
                        user = User.objects.get(id=user_id)
                        GroupMember.objects.get_or_create(group=group, user=user)
                        added_count += 1
                    except User.DoesNotExist:
                        self.message_user(request, _("User with ID {} not found.").format(user_id), messages.WARNING)
                        
                self.message_user(request, _("Successfully added {} members to the group.").format(added_count))
                return HttpResponseRedirect('..')
            return HttpResponseRedirect('..')
        except Exception as e:
            import logging
            logging.error(f"Error in GroupAdmin.add_members: {e}")
            self.message_user(request, _("An error occurred while adding members."), messages.ERROR)
            return HttpResponseRedirect('..')
        
    def response_change(self, request, obj):
        try:
            if "_add_members" in request.POST:
                user_ids = request.POST.getlist('users')
                added_count = 0
                for user_id in user_ids:
                    try:
                        user = User.objects.get(id=user_id)
                        GroupMember.objects.get_or_create(group=obj, user=user)
                        added_count += 1
                    except User.DoesNotExist:
                        self.message_user(request, _("User with ID {} not found.").format(user_id), messages.WARNING)
                        
                self.message_user(request, _("Successfully added {} members to the group.").format(added_count))
                return HttpResponseRedirect('.')
            return super().response_change(request, obj)
        except Exception as e:
            import logging
            logging.error(f"Error in GroupAdmin.response_change: {e}")
            self.message_user(request, _("An error occurred while adding members."), messages.ERROR)
            return super().response_change(request, obj)
        
    def save_formset(self, request, form, formset, change):
        try:
            instances = formset.save(commit=False)
            for instance in instances:
                if isinstance(instance, GroupMember) and not instance.pk and not instance.group_id:
                    instance.group = form.instance
                instance.save()
            formset.save_m2m()
        except Exception as e:
            import logging
            logging.error(f"Error in GroupAdmin.save_formset: {e}")
            raise

class DocumentAdmin(admin.ModelAdmin):
    list_display = ('thesis', 'uploaded_by', 'document_type', 'created_at')
    list_filter = ('document_type', 'created_at')
    search_fields = ('thesis__title', 'uploaded_by__email')
    date_hierarchy = 'created_at'

class ApprovalSheetInline(admin.TabularInline):
    model = ApprovalSheet
    extra = 1
    fields = ('panel_member', 'decision', 'comments', 'submitted_at')
    readonly_fields = ('submitted_at',)


class EvaluationInline(admin.TabularInline):
    model = Evaluation
    extra = 1
    fields = ('evaluator', 'recommendation', 'total_score', 'submitted_at')
    readonly_fields = ('submitted_at',)


class DefenseScheduleAdmin(admin.ModelAdmin):
    list_display = ('thesis', 'start', 'end', 'location', 'status', 'organizer')
    list_filter = ('status', 'start', 'created_at')
    search_fields = ('thesis__title', 'location', 'organizer__email')
    date_hierarchy = 'start'
    inlines = [ApprovalSheetInline, EvaluationInline]
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('thesis', 'title', 'status', 'organizer')
        }),
        ('Schedule Details', {
            'fields': ('start', 'end', 'location', 'meeting_url')
        }),
        ('Participants', {
            'fields': ('panel_members',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    filter_horizontal = ('panel_members',)
    ordering = ('-start',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('thesis', 'organizer').prefetch_related('panel_members')

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

class ApprovalSheetAdmin(admin.ModelAdmin):
    list_display = ('schedule', 'panel_member', 'decision', 'submitted_at')
    list_filter = ('decision', 'submitted_at')
    search_fields = ('schedule__thesis__title', 'panel_member__email')
    date_hierarchy = 'submitted_at'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Approval Information', {
            'fields': ('schedule', 'panel_member', 'decision')
        }),
        ('Details', {
            'fields': ('comments', 'document')
        }),
        ('Timestamps', {
            'fields': ('submitted_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('schedule', 'evaluator', 'recommendation', 'total_score', 'submitted_at')
    list_filter = ('recommendation', 'submitted_at')
    search_fields = ('schedule__thesis__title', 'evaluator__email')
    date_hierarchy = 'submitted_at'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Evaluation Information', {
            'fields': ('schedule', 'evaluator', 'recommendation', 'total_score')
        }),
        ('Details', {
            'fields': ('rubric_scores', 'comments', 'document')
        }),
        ('Timestamps', {
            'fields': ('submitted_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ThesisAdmin(admin.ModelAdmin):
    list_display = ('title', 'group', 'adviser', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'group__name', 'adviser__email', 'proposer__email')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'abstract', 'keywords', 'status')
        }),
        ('Relationships', {
            'fields': ('group', 'proposer', 'adviser')
        }),
        ('Feedback', {
            'fields': ('adviser_feedback',)
        }),
        ('Google Drive', {
            'fields': ('drive_folder_id', 'archived_document'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-created_at',)
    list_per_page = 25

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('group', 'adviser', 'proposer')


class ArchiveRecordAdmin(admin.ModelAdmin):
    list_display = ('content_type', 'original_id', 'archived_by', 'archived_at', 'expires_at')
    list_filter = ('content_type', 'archived_at', 'expires_at')
    search_fields = ('content_type', 'original_id', 'archived_by__email')
    date_hierarchy = 'archived_at'
    readonly_fields = ('created_at', 'updated_at', 'expires_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('content_type', 'original_id', 'data', 'reason')
        }),
        ('Archival Details', {
            'fields': ('archived_by', 'retention_period_years', 'archived_at', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-archived_at',)

# Register models
admin.site.register(User, UserAdmin)
admin.site.register(Group, GroupAdmin)
admin.site.register(GroupMember, GroupMemberAdmin)
admin.site.register(Thesis, ThesisAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(OralDefenseSchedule, DefenseScheduleAdmin)
admin.site.register(ApprovalSheet, ApprovalSheetAdmin)
admin.site.register(Evaluation, EvaluationAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(ArchiveRecord, ArchiveRecordAdmin)