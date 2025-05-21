from django.utils import timezone
from datetime import timedelta

def update_inactive_users():
    """Mark users as offline if they haven't been active for more than 10 minutes"""
    # inside function to avoid circular imports
    from user_app.models import UserProfile

    threshold = timezone.now() - timedelta(minutes=10)
    updated = UserProfile.objects.filter(is_online=True, last_activity__lt=threshold).update(
        is_online=False
    )
    return updated
