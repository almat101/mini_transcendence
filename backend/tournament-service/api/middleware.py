from django.http import JsonResponse
from django.db import connections, OperationalError

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
            'api.middleware.DatabaseConnectionMiddleware',
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
