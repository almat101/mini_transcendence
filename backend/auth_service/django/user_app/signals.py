from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.utils import timezone

"""
Signal handler that updates user's online status and last activity timestamp when they log in.

This function is triggered by Django's user_logged_in signal. It marks the user as online
and updates their last activity timestamp to the current time.

Args:
    sender: The model class that sent the signal
    request: The HTTP request that triggered the login
    user: The User instance that just logged in
    **kwargs: Additional keyword arguments passed by the signal

Note:
    The function updates only the 'is_online' and 'last_activity' fields of the user model
    for better performance.
"""
@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    user.is_online = True
    user.last_activity = timezone.now()
    user.save(update_fields=['is_online', 'last_activity'])


"""
Signal handler that updates user's online status when they log out.

This function is triggered when a user logs out of the system. It sets the user's
'is_online' status to False and saves the change to the database.

Args:
    sender: The model class that sent the signal
    request: The HTTP request object
    user: The User instance that just logged out
    **kwargs: Additional keyword arguments passed to the signal

Returns:
    None
"""
@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    user.is_online = False
    user.save(update_fields=['is_online'])
