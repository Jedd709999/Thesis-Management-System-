import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role='STUDENT', is_approved=True, **extra_fields):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
            
        user = self.model(email=email, role=role, is_approved=is_approved, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_approved', True)
        return self.create_user(email, password=password, role='ADMIN', **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ROLE_CHOICES = (
        ('STUDENT','Student'),
        ('ADVISER','Adviser'),
        ('PANEL','Panel'),
        ('ADMIN','Admin'),
    )
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=64, blank=True)
    last_name = models.CharField(max_length=64, blank=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default='STUDENT')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)  # New field for admin approval
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='date joined')
    
    def get_full_name(self):
        """
        Return the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name

    def generate_verification_token(self):
        """Generate a new verification token and update the timestamp"""
        self.email_verification_token = uuid.uuid4()
        self.email_verification_sent_at = timezone.now()
        self.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
        return self.email_verification_token
        
    def is_verification_token_valid(self, token):
        """Check if the verification token is valid and not expired"""
        if not self.email_verification_sent_at:
            return False
            
        token_lifetime = getattr(settings, 'EMAIL_VERIFICATION_TOKEN_LIFETIME_DAYS', 1)
        token_expiry = self.email_verification_sent_at + timedelta(days=token_lifetime)
        
        return (
            str(self.email_verification_token) == str(token) and
            timezone.now() <= token_expiry
        )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f'{self.email} ({self.role})'
