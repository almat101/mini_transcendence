from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from .serializers import CustomTokenObtainPairSerializer
from django.contrib.auth import get_user_model
import base64
import pyotp
import qrcode
import io

"""
Handle user login requests and authentication.

This view function processes login attempts, handles two-factor authentication if enabled,
and manages token-based authentication responses.

Args:
    request: The HTTP request object containing user credentials.
        Expected POST data:
        - username_or_email (str): User's username or email
        - password (str): User's password

Returns:
    Response: A Django REST framework Response object with different possible outcomes:
        - 400 Bad Request: If credentials are missing or invalid
        - 200 OK with requires_2fa=True: If 2FA is enabled for the user
        - 200 OK with access token: If authentication is successful
            - Sets HttpOnly refresh token cookie
            - Returns access token in response body

Raises:
    N/A

Example:
    POST /api/login/
    {
        "username_or_email": "user@example.com",
        "password": "userpassword"
    }
"""
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    data = request.data
    username_or_email = data.get('username_or_email')
    password = data.get('password')

    if username_or_email is None or password is None:
        return Response({'error': 'Please provide both username/email and password'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username_or_email, password=password)
    if user is None:
        return Response({
            'error': 'Invalid credentials',
        }, status=status.HTTP_400_BAD_REQUEST)

    if not user.email_verified:
        return Response({
            'error': 'Email is not verified',
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if 2FA is enabled for this user
    if user.has_2fa:
        # Store user ID in session to continue authentication after 2FA verification
        request.session['2fa_user_id'] = user.id
        return Response({
            'requires_2fa': True,
            'user_id': user.id
        }, status=status.HTTP_200_OK)

    refresh = CustomTokenObtainPairSerializer.get_token(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    login(request, user)

    response = Response({
        'access': access_token,
    }, status=status.HTTP_200_OK)

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,  # Ensures the cookie is only sent over HTTPS
        samesite='Lax',  # Prevents CSRF attacks
        max_age=7 * 24 * 60 * 60,  # Match the refresh token lifetime (7 days in your settings)
    )

    return response

"""
Handles user logout by blacklisting refresh token and removing cookie.

This view requires authentication and expects a POST request.
The function will blacklist the refresh token if present in cookies
and remove it from response cookies.

Args:
    request: Django HTTP request object containing user and cookie information

Returns:
    Response: JSON response with success message and HTTP 200 status
        if logout successful, or error message with HTTP 400 status
        if token error occurs

Raises:
    TokenError: If refresh token is invalid or expired
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        # Log user out
        logout(request)

        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie(
            key='refresh_token',
        )
        return response

    except TokenError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

"""
Refresh the access token using a refresh token stored in cookies.

This view function handles the token refresh process for authentication. It verifies the provided
refresh token and generates a new access token if the refresh token is valid.

Args:
    request: The HTTP request object containing the refresh token in cookies.

Returns:
    Response: A Django REST framework Response object with either:
        - 200 OK: New access token if refresh successful
        - 401 UNAUTHORIZED: If refresh token is missing, invalid, expired, or blacklisted
        - 500 INTERNAL_SERVER_ERROR: If token refresh fails due to unexpected error

The function performs the following checks:
    1. Verifies refresh token presence in cookies
    2. Validates the refresh token
    3. Checks if the token is blacklisted
    4. Confirms the user still exists in the database
    5. Generates a new access token

Raises:
    TokenError: When refresh token is invalid or expired
    Exception: For unexpected errors during token refresh process
"""
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_access_token(request):
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
        return Response(
            {'error': 'Refresh token missing'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        # Verify and generate new tokens
        refresh = RefreshToken(refresh_token)

        # Check if token is blacklisted
        if refresh.check_blacklist():
            return Response(
                {
                    'error': 'Refresh token is blacklisted'},
                    status=status.HTTP_401_UNAUTHORIZED
            ).delete_cookie(
                key='refresh_token'
            )

        User = get_user_model()

        if not User.objects.filter(id=refresh.payload['user_id']).exists():
            response = Response(
            {
                'error': 'User does not exist'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie('refresh_token')
            return response

        # Generate new access token
        access_token = str(refresh.access_token)

        response = Response({
            'access': access_token,
        }, status=status.HTTP_200_OK)

        return response

    except TokenError:
        return Response(
            {'error': 'Invalid or expired refresh token'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': 'Token refresh failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_token(request):
    return Response({'valid': True}, status=status.HTTP_200_OK)


"""Initialize 2FA setup by generating a secret and QR code.

This view handles the initialization of Two-Factor Authentication (2FA) setup for an authenticated user.
It generates a secret key and creates a QR code that can be scanned by authenticator apps.

Args:
    request: HTTP request object containing user information.

Returns:
    Response: JSON response containing:
        - secret: Base32 encoded secret key
        - qr_code: Base64 encoded QR code image in data URI format

Raises:
    HTTP 400: If user already has 2FA enabled

Required permissions:
    - User must be authenticated (IsAuthenticated)

Notes:
    - The secret is temporarily stored in the session as 'temp_2fa_secret'
    - QR code is generated using the user's email and 'Transcendence' as issuer name
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    """Initialize 2FA setup by generating a secret and QR code"""
    # Check if user already has 2FA enabled
    if request.user.has_2fa:
        return Response({'error': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate a new secret key
    secret = pyotp.random_base32()

    # Create a QR code for the secret
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(request.user.email, issuer_name="Transcendence")

    # Generate QR code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert image to base64 for frontend display
    buffer = io.BytesIO()
    img.save(buffer)
    img_str = base64.b64encode(buffer.getvalue()).decode()

    # Store secret temporarily in session
    request.session['temp_2fa_secret'] = secret

    return Response({
        'secret': secret,
        'qr_code': f'data:image/png;base64,{img_str}'
    })


"""
Verify the 2FA setup token and enable two-factor authentication for the user.

This endpoint validates the provided 2FA token against the temporary secret stored in the session.
If validation succeeds, 2FA is enabled for the user by saving the secret and updating user settings.

Args:
    request: Django REST framework request object containing:
        - token (str): The 2FA verification token from authenticator app
        - user (User): The authenticated user from request
        - session: Session containing temporary 2FA secret

Returns:
    Response: JSON response with:
        - On success: {'message': '2FA has been successfully enabled'} with 200 status
        - On error: {'error': error_message} with 400 status for:
            - Missing token
            - No setup in progress (no temp secret)
            - Invalid token

Requires:
    - User authentication
    - pyotp.TOTP for token verification
    - Active session with temp_2fa_secret

Side Effects:
    - Updates user.twofa_secret and user.has_2fa in database
    - Removes temp_2fa_secret from session
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa_setup(request):
    """Verify the setup token and enable 2FA for the user"""
    token = request.data.get('token')

    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get the temporary secret from session
    secret = request.session.get('temp_2fa_secret')
    if not secret:
        return Response({'error': 'No 2FA setup in progress'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify the token
    totp = pyotp.TOTP(secret)
    if not totp.verify(token, valid_window=1):
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

    # Token is valid, save the secret and enable 2FA
    user = request.user
    user.twofa_secret = secret
    user.has_2fa = True
    user.save()

    # Clean up session
    del request.session['temp_2fa_secret']

    return Response({'message': '2FA has been successfully enabled'})


"""
Disable Two-Factor Authentication (2FA) for the authenticated user.

This view requires authentication and handles the disabling of 2FA for a user's account.
The user must verify their identity either by providing a valid 2FA token or their password.

Args:
    request (Request): The HTTP request object containing:
        - token (str, optional): Current valid 2FA token
        - password (str, optional): User's current password if token not provided

Returns:
    Response: JSON response with:
        - On success: {'message': '2FA has been disabled'} with HTTP 200
        - On error: {'error': error_message} with HTTP 400
            Possible errors:
            - '2FA is not enabled'
            - 'Invalid token'
            - 'Password verification failed'

Raises:
    None

Required Permissions:
    - User must be authenticated (IsAuthenticated)
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """Disable 2FA for the user"""
    token = request.data.get('token')

    if not request.user.has_2fa:
        return Response({'error': '2FA is not enabled'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify token before disabling
    if token:
        totp = pyotp.TOTP(request.user.twofa_secret)
        if not totp.verify(token, valid_window=1):
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        # If no token provided, require password verification instead
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'error': 'Password verification failed'}, status=status.HTTP_400_BAD_REQUEST)

    # Disable 2FA
    user = request.user
    user.has_2fa = False
    user.twofa_secret = None
    user.save()

    return Response({'message': '2FA has been disabled'})


"""
Verify a 2FA token for an authenticated user to validate specific actions.

This endpoint allows verification of a 2FA token outside of the login process,
typically used for validating sensitive operations that require additional security.

Args:
    request: The HTTP request object containing:
        - token (str): The 2FA token to verify
        - user (User): The authenticated user making the request (from authentication)

Returns:
    Response: A JSON response with the following possible formats:
        - {'valid': True} with HTTP 200 if token is valid
        - {'error': str} with HTTP 400 if:
            - Token is missing
            - 2FA is not enabled for the user
            - Token is invalid

Requires:
    - Authentication
    - User must have 2FA enabled
    - Valid 2FA token within the current time window

Example:
    POST /verify-2fa-token/
    {
        "token": "123456"
    }
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa_token(request):
    """Verify a 2FA token outside of login (for validating actions)"""
    token = request.data.get('token')

    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    if not request.user.has_2fa:
        return Response({'error': '2FA is not enabled for this user'}, status=status.HTTP_400_BAD_REQUEST)

    totp = pyotp.TOTP(request.user.twofa_secret)
    if not totp.verify(token, valid_window=1):
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'valid': True})

"""Verify 2FA code during login process.

This view handles the verification of Two-Factor Authentication (2FA) codes
during the login process. It expects a POST request with a token and checks
it against the user's 2FA secret.

Args:
    request: The HTTP request object containing:
        - token (str): The 2FA verification code
        - session with '2fa_user_id': User ID stored during initial login

Returns:
    Response: JSON response with:
        - On success:
            - HTTP 200 with access token in body
            - refresh token set in HttpOnly cookie
        - On failure:
            - HTTP 400 if token/session missing or invalid token
            - HTTP 404 if user not found

Security:
    - Endpoint is publicly accessible (@AllowAny)
    - Refresh token is set as HttpOnly cookie
    - Cookie is secure and SameSite=Lax
    - Session data is cleared after successful verification

Dependencies:
    - pyotp.TOTP for token verification
    - CustomTokenObtainPairSerializer for JWT token generation
"""
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_2fa_login(request):
    """Verify 2FA code during login process"""
    token = request.data.get('token')
    user_id = request.session.get('2fa_user_id')
    print(f"2FA user ID: {request.session.get('2fa_user_id')}")

    if not token or not user_id:
        return Response({'error': 'Refresh the page and retry'}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        print(f"User 2FA secret: {user.twofa_secret[:5]}...")
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        totp = pyotp.TOTP(user.twofa_secret)
        if not totp.verify(token, valid_window=1):
            return Response({'error': 'Invalid 2FA token'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"2FA verification error: {str(e)}")
        return Response({'error': '2FA verification failed'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate tokens
    refresh = CustomTokenObtainPairSerializer.get_token(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    try:
        login(request, user)
    except Exception as e:
        print(f"Login error: {str(e)}")

    response = Response({
        'access': access_token,
    }, status=status.HTTP_200_OK)

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='Lax',
        max_age=7 * 24 * 60 * 60,
    )
    return response
