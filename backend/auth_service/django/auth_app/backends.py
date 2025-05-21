from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend that allows users to login with either their username or email.

    This backend extends Django's ModelBackend to provide authentication using either
    username or email credentials. It first attempts to authenticate using the username,
    and if that fails, it tries using the email address.

    Attributes:
        Inherits all attributes from django.contrib.auth.backends.ModelBackend

    Methods:
        authenticate(request, username=None, password=None, **kwargs):
            Authenticates a user using either username or email.

    Args:
        request: The HTTP request object
        username (str): The username or email to authenticate with
        password (str): The password to verify
        **kwargs: Additional keyword arguments

    Returns:
        User: The authenticated user object if credentials are valid
        None: If authentication fails
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None

        if user.check_password(password):
            return user
        return None
