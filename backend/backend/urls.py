from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home(request):
    return HttpResponse("""
    <h1>Thesis Management System</h1>
    <p>The API is available at <a href='/api/'>/api/</a></p>
    <p>Admin interface is available at <a href='/admin/'>/admin/</a></p>
    """, content_type="text/html")

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Changed from 'backend.api.urls' to 'api.urls'
]
