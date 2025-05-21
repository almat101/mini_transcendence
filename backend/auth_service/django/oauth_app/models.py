from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class OAuth2Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    provider = models.CharField(max_length=20) # e.g. '42', 'google', 'facebook'
    provider_user_id = models.CharField(max_length=255)
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('provider', 'provider_user_id')
