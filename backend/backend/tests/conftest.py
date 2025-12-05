import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO
from PIL import Image

User = get_user_model()

@pytest.fixture
def api_client():
    """Return an API client instance"""
    return APIClient()

@pytest.fixture
def user_factory():
    """Factory for creating test users"""
    def create_user(email='test@example.com', password='testpass123', role='STUDENT', **kwargs):
        return User.objects.create_user(
            email=email,
            password=password,
            role=role,
            first_name=kwargs.get('first_name', 'Test'),
            last_name=kwargs.get('last_name', 'User'),
            **kwargs
        )
    return create_user

@pytest.fixture
def admin_user(user_factory):
    """Create an admin user"""
    return user_factory(
        email='admin@test.com',
        password='admin123',
        role='ADMIN',
        is_staff=True,
        is_superuser=True
    )

@pytest.fixture
def adviser_user(user_factory):
    """Create an adviser user"""
    return user_factory(
        email='adviser@test.com',
        password='adviser123',
        role='ADVISER',
        is_staff=True
    )

@pytest.fixture
def student_user(user_factory):
    """Create a student user"""
    return user_factory(
        email='student@test.com',
        password='student123',
        role='STUDENT'
    )

@pytest.fixture
def panel_user(user_factory):
    """Create a panel user"""
    return user_factory(
        email='panel@test.com',
        password='panel123',
        role='PANEL'
    )

@pytest.fixture
def authenticated_client(api_client, student_user):
    """Return an authenticated API client"""
    refresh = RefreshToken.for_user(student_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def admin_client(api_client, admin_user):
    """Return an admin authenticated API client"""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def adviser_client(api_client, adviser_user):
    """Return an adviser authenticated API client"""
    refresh = RefreshToken.for_user(adviser_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def panel_client(api_client, panel_user):
    """Return a panel authenticated API client"""
    refresh = RefreshToken.for_user(panel_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def sample_pdf():
    """Create a sample PDF file for testing"""
    pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF'
    return SimpleUploadedFile(
        "test_document.pdf",
        pdf_content,
        content_type="application/pdf"
    )

@pytest.fixture
def sample_image():
    """Create a sample image file for testing"""
    image = Image.new('RGB', (100, 100), 'red')
    image_io = BytesIO()
    image.save(image_io, 'JPEG')
    image_io.seek(0)
    
    return SimpleUploadedFile(
        "test_image.jpg",
        image_io.getvalue(),
        content_type="image/jpeg"
    )

@pytest.fixture
def sample_docx():
    """Create a sample DOCX file for testing"""
    # Minimal DOCX structure (simplified for testing)
    docx_content = b'PK\x03\x04\x14\x00\x00\x00\x08\x00' + b'\x00' * 100  # Simplified ZIP header
    return SimpleUploadedFile(
        "test_document.docx",
        docx_content,
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@pytest.fixture(autouse=True)
def media_storage(settings, tmpdir):
    """Configure media storage for tests"""
    settings.MEDIA_ROOT = tmpdir.mkdir('media')
    return settings.MEDIA_ROOT
