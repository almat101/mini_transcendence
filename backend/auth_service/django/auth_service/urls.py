"""
This module defines the main URL routing configuration for the auth_service Django project.
It maps URL patterns to their corresponding views and includes URL configurations from other apps.

URL Patterns:
    - admin/: Django admin interface
    - api/auth/: Authentication related endpoints from auth_app
    - api/user/: User management endpoints from user_app
    - api/oauth/: OAuth authentication endpoints from oauth_app
    - /: Prometheus metrics endpoints
    - watchman/: Health check endpoints for monitoring service status

Dependencies:
    - django.contrib.admin: For admin interface
    - django.urls: For URL routing functionality
    - django_prometheus: For metrics collection
    - watchman: For health monitoring
    - auth_app, user_app, oauth_app: Custom apps for authentication and user management
"""

from django.contrib import admin
from django.urls import path, include, re_path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_app.urls')),
    path('api/user/', include('user_app.urls')),
    #path('api/oauth/', include('oauth_app.urls')),
    path('', include('django_prometheus.urls')),
    re_path(r'^watchman/', include('watchman.urls')) # Health status
]
