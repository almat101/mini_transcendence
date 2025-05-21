from django.urls import path
from . import views

urlpatterns = [
    path('42/login/', views.oauth2_login, name='42-login'),
    path('42/callback/', views.oauth2_callback, name='42-callback'),
]
