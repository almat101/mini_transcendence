"""
    A custom JWT token serializer that extends TokenObtainPairSerializer.

    This serializer adds additional custom claims to the JWT token including user_id and username.

    Methods:
        get_token(user): Creates a JWT token for the given user with custom claims.

    Args:
        user: The user instance for which the token is being generated.

    Returns:
        token: A JWT token object with custom claims including user_id and username.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['user_id'] = user.id
        token['username'] = user.username

        return token
