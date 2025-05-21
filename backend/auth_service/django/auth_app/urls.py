"""
URL patterns for authentication endpoints.

Endpoints:
    - /login/ (POST): User login endpoint
    - /logout/ (POST): User logout endpoint
    - /refresh/ (POST): Refresh access token endpoint
    - /validate/ (POST): Validate token endpoint
    - /2fa/setup/ (POST): Setup 2FA for user account
    - /2fa/verify-setup/ (POST): Verify 2FA setup process
    - /2fa/disable/ (POST): Disable 2FA for user account
    - /2fa/verify/ (POST): Verify 2FA token
    - /2fa/verify-login/ (POST): Verify 2FA during login process

The urls are mapped to their respective view functions in views.py.
All endpoints handle authentication and 2FA-related operations.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'), # done
    path('logout/', views.logout_view, name='logout'), # done
    path('refresh/', views.refresh_access_token, name='refresh_access_token'),
    path('validate/', views.validate_token, name='validate_token'),
    path('2fa/setup/', views.setup_2fa, name='setup-2fa'),
    path('2fa/verify-setup/', views.verify_2fa_setup, name='verify-2fa-setup'),
    path('2fa/disable/', views.disable_2fa, name='disable-2fa'),
    path('2fa/verify/', views.verify_2fa_token, name='verify-2fa-token'),
    path('2fa/verify-login/', views.verify_2fa_login, name='verify-2fa-login'),
]
