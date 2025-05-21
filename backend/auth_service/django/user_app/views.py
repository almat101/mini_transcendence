import os
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .serializers import (
    UserCreateSerializer,
    UserUpdateSerializer,
    BaseUserSerializer,
    PasswordUpdateSerializer,
    AvatarUpdateSerializer,
    FriendSerializer
)
from .models import UserProfile, Friends
from django.db import models

from .utils import generate_otp, verify_otp
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

# Create your views here.

"""
Handle user registration endpoint.

This view handles the signup process for new users. It accepts POST requests with user
registration data, validates it using UserCreateSerializer, and creates a new user if
the data is valid.

Args:
    request: DRF Request object containing the registration data in request.data
            Expected fields are defined in UserCreateSerializer

Returns:
    Response: A JSON response with:
        - On success: 201 Created status with success message
        - On failure: 400 Bad Request status with validation errors

Permissions:
    - AllowAny: This endpoint is publicly accessible

Note:
    Password hashing is handled automatically by the serializer.
    Email verification functionality is currently commented out.
"""
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = UserCreateSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()  # No need to hash password, serializer handles it

        # Send email verification
        email_otp = generate_otp()
        user.email_otp = email_otp
        user.save()

        try:
            send_mail(
                'TRANSCENDENCE -- Email Verification OTP',
                f'Your OTP for email verification is: {email_otp}',
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            request.session['id'] = user.id
        except Exception as e:
            user.delete()
            return Response({
                'error': 'Failed to send verification email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'User created successfully',
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_otp(request):
    user = UserProfile.objects.get(id=request.session['id'])
    email_otp = request.data.get('email_otp')

    if verify_otp(email_otp, user.email_otp):
        user.email_verified = True
        user.email_otp = None
        user.save()
        return Response({
            'message': 'Email verified successfully',
        }, status=status.HTTP_200_OK)

    del request.session['id']

    return Response({
        'error': 'Invalid OTP'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_email_otp(request):
    email = request.data.get('email')
    try:
        user = UserProfile.objects.get(email=email)
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if (user.email_verified):
        return Response({
            'error': 'Email already verified'
        }, status=status.HTTP_400_BAD_REQUEST)

    email_otp = generate_otp()
    user.email_otp = email_otp
    user.save()

    try:
        send_mail(
            'TRANSCENDENCE -- Email Verification OTP',
            f'Your OTP for email verification is: {email_otp}',
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )
    except Exception as e:
        return Response({
            'error': 'Failed to send verification email. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    request.session['id'] = user.id

    return Response({
        'message': 'Email OTP resent successfully',
    }, status=status.HTTP_200_OK)

"""
Update user password endpoint (not allowed for OAuth users).

This endpoint allows authenticated users to update their password by providing their old
password and a new password. OAuth users are not allowed to use this endpoint.

Args:
    request (Request): The HTTP request object containing user data and authentication.

Returns:
    Response: JSON response with success/error message and appropriate HTTP status code.
        - 200 OK: Password successfully updated
        - 400 Bad Request:
            * If user is OAuth authenticated
            * If old password is incorrect
            * If password validation fails
            * If request data is invalid

Required Headers:
    - Authorization: Bearer <token>

Request Body:
    - old_password (str): User's current password
    - new_password (str): Desired new password

Example Success Response:
    {
        "message": "Password updated successfully"
    }

Example Error Response:
    {
        "error": "OAuth users cannot update their password"
    }
    or
    {
        "error": ["Wrong password."]
    }
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_password(request):
    """Update user password (not allowed for OAuth users)"""
    if request.user.has_oauth:
        return Response({
            'error': 'OAuth users cannot update their password'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = PasswordUpdateSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': ['Wrong password.']
            }, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


"""
Retrieve user information based on the provided user_id or the authenticated user.

This endpoint returns detailed information about a user profile. If a user_id is provided
in the query parameters, it returns information about that specific user. Otherwise,
it returns information about the authenticated user making the request.

Args:
    request (Request): The HTTP request object containing query parameters and user authentication.

Returns:
    Response: A JSON response containing:
        - User profile information serialized by BaseUserSerializer
        - 'is_self' boolean field indicating if the profile belongs to the requesting user
        - HTTP_200_OK status on success

Raises:
    HTTP_500_INTERNAL_SERVER_ERROR: If there's an error during user info retrieval
    HTTP_404_NOT_FOUND: If the requested user_id doesn't exist

Required Permissions:
    - IsAuthenticated: User must be authenticated to access this endpoint
"""
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user_id = request.query_params.get('user_id')
    try:
        if user_id:
            user = get_object_or_404(UserProfile, id=user_id)
        else:
            user = request.user

        serializer = BaseUserSerializer(user, context={'request': request})
        data = serializer.data
        data['is_self'] = user.id == request.user.id

        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Failed to fetch user info: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

"""
Update the avatar of the authenticated user.

This view handles the POST request to update a user's avatar image. It processes
the uploaded file, manages the old avatar deletion, and saves the new avatar
with a unique filename based on the username.

Args:
    request: The HTTP request object containing:
        - FILES['avatar']: The uploaded avatar image file
        - user: The authenticated user object

Returns:
    Response: A JSON response containing:
        - On success:
            - message: Success confirmation
            - avatar: URL path to the new avatar
            - status: 200 OK
        - On validation error:
            - Serializer validation errors
            - status: 400 BAD REQUEST
        - On processing error:
            - error: Error description
            - status: 500 INTERNAL SERVER ERROR

Requires:
    - User authentication (@IsAuthenticated)
    - POST method
    - MultiPart form data with 'avatar' file

Note:
    The old avatar file is deleted if it exists and is not the default avatar.
    The new avatar filename is formatted as: avatar_username{extension}
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    serializer = AvatarUpdateSerializer(
        request.user,
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        try:
            avatar_file = request.FILES['avatar']

            # Get file extension
            file_ext = os.path.splitext(avatar_file.name)[1]

            # Create new filename with username to avoid conflicts
            avatar_file.name = f"avatar_{request.user.username}{file_ext}"

            # Delete old avatar if it exists and isn't the default
            if request.user.avatar and 'default_avatar' not in request.user.avatar.name:
                if os.path.isfile(request.user.avatar.path):
                    os.remove(request.user.avatar.path)

            # Save using the serializer
            serializer.save()

            # Return the complete URL
            avatar_url = f"/media/avatars/{os.path.basename(request.user.avatar.name)}"

            return Response({
                'message': 'Avatar updated successfully',
                'avatar': avatar_url
            })

        except Exception as e:
            return Response({
                'error': f'Failed to update avatar: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

"""
Update user profile information.

This view allows authenticated users to update their profile information through a PATCH request.
The update can be partial, meaning only the fields that are provided will be updated.

Args:
    request: HTTP request object containing user data to update.
        The request must be authenticated and can include the following fields:
        - username (optional)
        - email (optional)
        - bio (optional)
        - avatar (optional)

Returns:
    Response: A JSON response containing:
        - message: Success message indicating what was updated
        - user: Updated user data serialized through UserUpdateSerializer

    Status codes:
        - 200: Successful update
        - 400: Invalid data provided
        - 401: Unauthorized request

Requires:
    - Authentication
    - UserUpdateSerializer
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user(request):
    serializer = UserUpdateSerializer(
        request.user,
        data=request.data,
        partial=True,
        context={'request': request}
    )

    if serializer.is_valid():
        user = serializer.save()
        message = 'Bio updated successfully' if user.has_oauth else 'Profile updated successfully'

        return Response({
            'message': message,
            'user': UserUpdateSerializer(user).data
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

"""Delete user account with password confirmation.

This view function handles the deletion of a user account. It requires authentication
and password confirmation for non-OAuth users.

Args:
    request: HTTP request object containing:
        - user: The authenticated user object
        - data: Request data containing 'password' for non-OAuth users
        - COOKIES: Request cookies containing 'refresh_token'

Returns:
    Response object with:
        - On success: 200 status code with success message and cleared refresh token cookie
        - On invalid/missing password: 400 status code with error message
        - On deletion failure: 500 status code with error message

Raises:
    Exception: If user deletion process fails

Security:
    - Requires authentication (@IsAuthenticated)
    - Requires password confirmation for non-OAuth users
    - Blacklists refresh token on successful deletion
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_user(request):
    """Delete user account with password confirmation"""
    user = request.user

    if not user.has_oauth:
        password = request.data.get('password')
        if not password:
            return Response({
                'error': 'Password is required for account deletion'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({
                'error': 'Invalid password'
            }, status=status.HTTP_400_BAD_REQUEST)

    try:
        #username = user.username
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        user.delete()

        #logger.info(f"User account deleted: {username}")
        response = Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie(
            key='refresh_token',
        )
        return response

    except Exception as e:
        #logger.error(f"Error deleting user account: {str(e)}")
        return Response({
            'error': 'Failed to delete account'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

"""
Search users by username or email.

This endpoint allows authenticated users to search for other users by their username or email.
The search is case-insensitive and matches partial strings.

Args:
    request: HTTP request object containing:
        - query_params['q']: Search query string (min 2 characters)

Returns:
    Response: A JSON response containing a list of matching users with their:
        - id: User ID
        - username: Username
        - avatar: Avatar URL
        - status: Friendship status with requesting user
        - is_online: Online status

Response Format:
    [
        {
            "id": int,
            "username": str,
            "avatar": str,
            "status": str,
            "is_online": bool
        },
        ...
    ]

Raises:
    400 Bad Request: If search query is less than 2 characters
    500 Internal Server Error: If search operation fails

Required Permissions:
    - User must be authenticated
"""
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search users by username or email"""
    query = request.query_params.get('q', '').strip()

    if len(query) < 2:
        return Response({
            'error': 'Search query must be at least 2 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        users = UserProfile.search_users(query, request.user)
        serializer = BaseUserSerializer(users, many=True)

        # Add friendship status to response
        result = []
        for user_data in serializer.data:
            matching_user = next(
                (u for u in users if u.id == user_data['id']),
                None
            )

            if matching_user:
                status = matching_user.friendship_status

                # Create an entry matching FriendSerializer format
                result.append({
                    'id': user_data['id'],
                    'username': user_data['username'],
                    'avatar': user_data['avatar'],
                    'status': status,
                    'is_online': user_data['is_online'],
                })

        return Response(result)

    except Exception as e:
        return Response({
            'error': f'Search failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#FRIENDS VIEWS

"""
Send a friend request to another user.

This view handles the creation of friend requests between authenticated users.
It prevents self-friending and duplicate friend requests.

Args:
    request (HttpRequest): The HTTP request object containing:
        - id (int): The ID of the user to send the friend request to
        - user (User): The authenticated user sending the request (from authentication)

Returns:
    Response: A JSON response with:
        - On success (201):
            - message: Success confirmation
            - request: Serialized friend request data
        - On error (400):
            - error: Error message describing why request failed

Raises:
    Http404: If the target user does not exist

Permission:
    Requires authentication

Request Body:
    {
        "id": integer
    }
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    friend_id = request.data.get('id')
    if not friend_id:
        return Response({
            'error': 'User ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    friend = get_object_or_404(UserProfile, id=friend_id)

    # Prevent self-friending
    if friend == request.user:
        return Response({
            'error': 'You cannot send a friend request to yourself'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check for existing relationship
    existing = Friends.objects.filter(
        (models.Q(user=request.user, friend=friend) |
         models.Q(user=friend, friend=request.user)),
        status__in=['pending', 'accepted']
    ).first()

    if existing:
        status_msg = 'pending' if existing.status == 'pending' else 'already friends'
        return Response({
            'error': f'A friend request is already {status_msg}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create the friend request
    friend_request = Friends.objects.create(
        user=request.user,
        friend=friend,
        status='pending'
    )

    # Serialize for response
    serializer = FriendSerializer(friend_request, context={'request': request})

    return Response({
        'message': 'Friend request sent successfully',
        'request': serializer.data
    }, status=status.HTTP_201_CREATED)

"""
Accept or reject a friend request from another user.

This endpoint handles the response to a friend request, allowing the user to either accept
or reject a pending friend request. The requesting user must be authenticated.

Args:
    request: HTTP request object containing:
        - id (int): The ID of the user who sent the friend request
        - action (str): Either 'accept' or 'reject'

Returns:
    Response: A JSON response with:
        - On success:
            - message: Success message
            - status: 200 OK
        - On error:
            - error: Error message
            - status: 400 BAD REQUEST if invalid/missing parameters
            - status: 404 NOT FOUND if no pending request exists

Raises:
    Http404: If the friend with given ID doesn't exist

Required permissions:
    - User must be authenticated (IsAuthenticated)
"""
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_friend_request(request):
    """Accept or reject a friend request"""
    friend_id = request.data.get('id')
    action = request.data.get('action')  # 'accept' or 'reject'

    if not friend_id or not action:
        return Response(
            {'error': 'Friend ID and action are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if action not in ['accept', 'reject']:
        return Response(
            {'error': 'Invalid action'},
            status=status.HTTP_400_BAD_REQUEST
        )

    friend = get_object_or_404(UserProfile, id=friend_id)

    friend_request = Friends.objects.filter(
        user=friend,
        friend=request.user,
        status='pending'
    ).first()

    if not friend_request:
        return Response(
            {'error': 'No pending friend request found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if action == 'accept':
        friend_request.status = 'accepted'
        friend_request.save()

       #request.user.friends.add(friend)

        return Response(
            {'message': 'Friend request accepted'},
            status=status.HTTP_200_OK
        )

    # If rejected, just delete the friends
    friend_request.delete()
    return Response(
        {'message': 'Friend request rejected'},
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_friend(request):
    """Remove a friend relationship"""
    friend_id = request.data.get('id')

    if not friend_id:
        return Response(
            {'error': 'Friend ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    friend = get_object_or_404(UserProfile, id=friend_id)

    friend_request = Friends.objects.filter(
        (models.Q(user=request.user, friend=friend) |
         models.Q(user=friend, friend=request.user)),
        status='accepted'
    ).first()

    if not friend_request:
        return Response(
            {'error': 'No friend relationship found'},
            status=status.HTTP_404_NOT_FOUND
        )

    friend_request.delete()
    return Response(
        {'message': 'Friend removed successfully'},
        status=status.HTTP_200_OK
    )

"""
Retrieve a list of accepted friends for the authenticated user.

This view returns all friendship relationships where the authenticated user
is either the initiator or the recipient, and the friendship status is 'accepted'.

Args:
    request: The HTTP request object containing the authenticated user.

Returns:
    Response: A JSON response containing serialized friend relationships data.
        Each relationship includes details about both users involved in the friendship.

Requires:
    - User must be authenticated (IsAuthenticated permission class)
    - GET request method

Example response:
    [
        {
            "user": "user1",
            "friend": "user2",
            "status": "accepted",
            "created_at": "2023-01-01T00:00:00Z"
        },
        ...
    ]
"""
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_friends(request):
    serializer = FriendSerializer(
        Friends.objects.filter(
            (models.Q(user=request.user) | models.Q(friend=request.user)) &
            models.Q(status='accepted')
        ),
        many=True,
        context={'request': request}
    )
    return Response(serializer.data)



"""
Retrieve a list of pending friend requests for the authenticated user.

This view function returns all friend requests where the authenticated user
is the recipient and the status is 'pending'.

Args:
    request: The HTTP request object containing user authentication details.

Returns:
    Response: A JSON response containing serialized friend request data.
        Each friend request object includes details about the requesting user
        and the status of the request.

Required Permissions:
    - User must be authenticated (IsAuthenticated)

HTTP Methods:
    - GET: Retrieve pending friend requests

Example Response:
    [
        {
            "id": 1,
            "user": {"id": 2, "username": "john_doe"},
            "friend": {"id": 1, "username": "current_user"},
            "status": "pending",
            "created_at": "2023-01-01T00:00:00Z"
        },
        ...
    ]
"""
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_friend_requests(request):
    friend_requests = Friends.objects.filter(
        friend=request.user,
        status='pending'
    )

    serializer = FriendSerializer(friend_requests, many=True, context={'request': request})
    return Response(serializer.data)
