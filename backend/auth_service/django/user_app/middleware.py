from django.utils import timezone
from django.db import connections, OperationalError
from django.http import JsonResponse
from datetime import timedelta

class UserActivityMiddleware:
    """
    A Django middleware class that tracks user activity by updating the last_activity timestamp.

    This middleware monitors authenticated users' activities and updates their last_activity
    timestamp and online status in the database. To prevent excessive database writes,
    updates only occur if the last activity was more than 10 minutes ago.

    Attributes:
        get_response (callable): The next middleware or view function in the chain

    Methods:
        __call__(request): Process each request/response and update user activity status

    Example:
        To use this middleware, add it to your MIDDLEWARE setting in settings.py:
        MIDDLEWARE = [
            ...
            'path.to.UserActivityMiddleware',
            ...
        ]

    Note:
        Requires the User model to have 'last_activity' and 'is_online' fields
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Update last_activity for authenticated users
        if request.user.is_authenticated:
            current_time = timezone.now()
            # Only update last_activity if it was more than 5 minutes ago
            update_threshold = current_time - timedelta(minutes=5)

            if not request.user.last_activity or request.user.last_activity < update_threshold:
                request.user.last_activity = current_time
                request.user.is_online = True
                request.user.save(update_fields=['last_activity', 'is_online'])

        return response


class DatabaseConnectionMiddleware:
    """Middleware to check database connection availability before processing requests.

    This middleware checks if the database connection is working before processing each request.
    If the database is unavailable, it returns a 503 Service Unavailable response.

    Attributes:
        get_response (callable): The next middleware or view to be called
        db_available (bool): Flag indicating if database connection is available

    Methods:
        __call__(request): Process the request and check database availability
        _check_db_connection(): Test if database connection is working

    Example:
        Add to MIDDLEWARE in settings.py:
        MIDDLEWARE = [
            'path.to.DatabaseConnectionMiddleware',
            ...
        ]
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.db_available = True

    def __call__(self, request):
        # Check if database connection is available
        self.db_available = self._check_db_connection()

        if not self.db_available:
            return JsonResponse({
                'error': 'Database is currently unavailable. Please try again later.',
            }, status=503)

        # Continue processing the request
        return self.get_response(request)

    def _check_db_connection(self):
        """Check if database connection is working"""
        try:
            connections['default'].cursor().execute('SELECT 1')
            return True
        except OperationalError:
            return False
