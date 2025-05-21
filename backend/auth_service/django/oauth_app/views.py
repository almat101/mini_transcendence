import requests
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import OAuth2Profile
from auth_app.serializers import CustomTokenObtainPairSerializer
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth2_login(request):
    """Initiate 42 OAuth2 login flow"""
    config = settings.OAUTH2_PROVIDERS['42']
    auth_url = (
        f"{config['AUTHORIZATION_URL']}?"
        f"client_id={config['CLIENT_ID']}&"
        f"redirect_uri={config['REDIRECT_URI']}&"
        f"response_type=code&"
        f"scope={config['SCOPE']}&"
        f"state={config['STATE']}"
    )

    return Response({'authorization_url': auth_url})

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth2_callback(request):
    """Handle 42 OAuth2 callback"""
    code = request.GET.get('code')
    if not code:
        return Response({'error': 'Authorization code missing'},
                       status=status.HTTP_400_BAD_REQUEST)

    config = settings.OAUTH2_PROVIDERS['42']

    # Exchange code for tokens
    try:
        token_response = requests.post(
            config['TOKEN_URL'],
            data={
                'grant_type': 'authorization_code',
                'client_id': config['CLIENT_ID'],
                'client_secret': config['CLIENT_SECRET'],
                'code': code,
                'redirect_uri': config['REDIRECT_URI']
            }
        )
        logger.debug(f"Token response: {token_response.text}")

        if token_response.status_code != 200:
            return Response({
                'error': 'Token exchange failed',
                'details': token_response.text
            }, status=status.HTTP_400_BAD_REQUEST)

        tokens = token_response.json()

        # Get user info from 42
        user_response = requests.get(
            config['USER_INFO_URL'],
            headers={'Authorization': f"Bearer {tokens['access_token']}"}
        )
        #logger.debug(f"User info response: {user_response.text}")

        if user_response.status_code != 200:
            return Response({
                'error': 'Failed to get user info',
                'details': user_response.text
            }, status=status.HTTP_400_BAD_REQUEST)

        user_info = user_response.json()

        # Create or update user
        try:
            oauth_profile = OAuth2Profile.objects.get(
                provider='42',
                provider_user_id=str(user_info['id'])
            )
            user = oauth_profile.user
            # Update tokens
            oauth_profile.access_token = tokens['access_token']
            oauth_profile.refresh_token = tokens.get('refresh_token')
            oauth_profile.save()
        except OAuth2Profile.DoesNotExist:
            try:
                user = User.objects.get(email=user_info['email'])
                # Existing user, create OAuth profile
                OAuth2Profile.objects.create(
                    user=user,
                    provider='42',
                    provider_user_id=str(user_info['id']),
                    access_token=tokens['access_token'],
                    refresh_token=tokens.get('refresh_token')
                )
                user.has_oauth = True
                user.save()
            except User.DoesNotExist:
                # Create new user
                user = User.objects.create_user(
                    username=user_info['login'],
                    email=user_info['email'],
                    avatar=user_info['image'],
                )
                user.has_oauth = True
                user.save()

                # Create OAuth profile
                OAuth2Profile.objects.create(
                    user=user,
                    provider='42',
                    provider_user_id=str(user_info['id']),
                    access_token=tokens['access_token'],
                    refresh_token=tokens.get('refresh_token')
                )
    except Exception as e:
        logger.error(f"OAuth callback error: {str(e)}")
        return Response({
            'error': 'OAuth process failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Generate JWT tokens
    refresh = CustomTokenObtainPairSerializer.get_token(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    response = Response({
        'access': access_token,
    })

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=True,
        samesite='Lax',
        max_age=7 * 24 * 60 * 60
    )

    return response
