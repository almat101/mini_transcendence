import os
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.core.validators import EmailValidator
from .models import UserProfile, Friends
import re

class BaseUserSerializer(serializers.ModelSerializer):
    """
    A base serializer for user profiles that handles basic user data serialization and validation.

    This serializer includes fields for user profile data such as username, email, avatar,
    and other user-related information. It provides custom validation for usernames and
    handles avatar URL generation.

    Fields:
        id (int): The unique identifier for the user
        username (str): The user's username (3-20 characters, alphanumeric with underscores)
        email (str): The user's email address
        avatar (str): URL path to the user's avatar image
        bio (str): The user's biography or description
        created_at (datetime): Timestamp of when the user account was created
        has_oauth (bool): Indicates if the user has OAuth authentication enabled
        has_2fa (bool): Indicates if the user has Two-Factor Authentication enabled
        is_online (bool): Indicates if the user is currently online
        last_activity (datetime): Timestamp of the user's last activity

    Methods:
        validate_username(value): Validates username format and uniqueness
        get_avatar(obj): Generates the URL path for the user's avatar

    Note:
        - Username validation enforces 3-20 characters, only letters, numbers, and underscores
        - Username uniqueness is case-insensitive
        - created_at field is read-only
    """
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'avatar', 'bio', 'created_at', 'has_oauth', 'has_2fa' ,'is_online', 'last_activity']
        read_only_fields = ['created_at']

    def validate_username(self, value):
        """
        Validate username format:
        - 3-20 characters
        - Only letters, numbers, underscores
        - Case insensitive uniqueness
        """
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', value):
            raise serializers.ValidationError(
                "Username must be 3-20 characters and contain only letters, numbers, and underscores"
            )

        # Case insensitive username check
        if UserProfile.objects.filter(username__iexact=value).exclude(id=getattr(self.instance, 'id', None)).exists():
            raise serializers.ValidationError("This username is already taken")
        return value

    def get_avatar(self, obj):
        if obj.avatar:
            return f"/media/avatars/{os.path.basename(obj.avatar.name)}"
        return None


class UserCreateSerializer(BaseUserSerializer):
    """
    Serializer for user registration and account creation.

    This serializer extends BaseUserSerializer and handles user registration with
    password validation and email verification. It includes fields for password
    confirmation and enforces email uniqueness.

    Attributes:
        password (CharField): User's password field (write-only)
        confirm_password (CharField): Password confirmation field (write-only)

    Methods:
        validate_email(value):
            Validates email format and uniqueness (case-insensitive)
            Args:
                value (str): Email to validate
            Returns:
                str: Lowercase validated email
            Raises:
                ValidationError: If email format is invalid or already exists

        validate_password(value):
            Validates password using Django's password validators
            Args:
                value (str): Password to validate
            Returns:
                str: Validated password
            Raises:
                ValidationError: If password doesn't meet requirements

        validate(data):
            Performs cross-field validation
            Args:
                data (dict): Data to validate
            Returns:
                dict: Validated data
            Raises:
                ValidationError: If passwords don't match

        create(validated_data):
            Creates new user with hashed password
            Args:
                validated_data (dict): Validated user data
            Returns:
                UserProfile: Created user instance
    """

    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + ['password', 'confirm_password']
        extra_kwargs = {
            'email': {'required': True},
            'avatar': {'read_only': True},
            'bio': {'read_only': True}
        }

    def validate_email(self, value):
        """
        Validate email:
        - Format validation using Django's EmailValidator
        - Case insensitive uniqueness check
        """
        validator = EmailValidator()
        validator(value)

        if UserProfile.objects.filter(email__iexact=value).exclude(id=getattr(self.instance, 'id', None)).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value.lower()

    def validate_password(self, value):
        """Validate password using Django's password validators"""
        validate_password(value)
        return value

    def validate(self, data):
        """
        Additional validation:
        - Password confirmation check
        """
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data

    def create(self, validated_data):
        """Create new user with hashed password"""
        validated_data.pop('confirm_password')
        # Explicitly hash the password
        validated_data['password'] = make_password(validated_data['password'])
        user = UserProfile.objects.create(**validated_data)
        return user


class AvatarUpdateSerializer(serializers.ModelSerializer):
    """
    A serializer for handling user avatar updates.

    This serializer is specifically designed to handle avatar image updates for user profiles.
    It includes validation for:
    - OAuth users (not allowed to update avatars)
    - File size (max 5MB)
    - File type (must be an image)

    Attributes:
        Meta: Inner class defining the model and fields for serialization
            model: UserProfile model
            fields: Only includes 'avatar' field

    Methods:
        validate_avatar(value): Validates the uploaded avatar file
            Args:
                value: The uploaded file object
            Returns:
                The validated file object
            Raises:
                ValidationError: If validation fails for OAuth users, file size or file type
    """
    class Meta:
        model = UserProfile
        fields = ['avatar']

    def validate_avatar(self, value):
        user = self.context.get('request').user
        if user.has_oauth:
            raise serializers.ValidationError(
                "OAuth users cannot update their avatar"
            )

        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("Image size cannot exceed 5MB")

        # Add image type validation
        if not value.content_type.startswith('image/'):
            raise serializers.ValidationError("File must be an image")

        return value

class UserUpdateSerializer(serializers.ModelSerializer):
    """
    UserUpdateSerializer handles user profile updates, including username, email, and bio.

    This serializer implements validation and update logic for user profile fields, with special
    handling for OAuth users who have limited update capabilities.

    Attributes:
        fields (list): List of fields that can be updated: username, email, and bio.

    Validation Rules:
        username:
            - 3-20 characters long
            - Only letters, numbers, and underscores allowed
            - Must be unique (case-insensitive)

        email:
            - Must be valid email format
            - Must be unique (case-insensitive)
            - Stored in lowercase

        bio:
            - Maximum 300 characters

    Special Handling:
        OAuth Users:
            - Can only update their bio field
            - Attempts to update username or email will raise ValidationError
            - Other fields are automatically filtered out during update

    Methods:
        validate_username(value): Validates username format and uniqueness
        validate_email(value): Validates email format and uniqueness
        validate_bio(value): Validates bio length
        validate(data): Implements OAuth user restrictions
        update(instance, validated_data): Handles updates with OAuth user consideration
    """

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'bio']

    def validate_username(self, value):
        """
        Validate username format:
        - 3-20 characters
        - Only letters, numbers, underscores
        - Case insensitive uniqueness
        """
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', value):
            raise serializers.ValidationError(
                "Username must be 3-20 characters and contain only letters, numbers, and underscores"
            )

        # Case insensitive username check
        if UserProfile.objects.filter(username__iexact=value).exclude(id=getattr(self.instance, 'id', None)).exists():
            raise serializers.ValidationError("This username is already taken")
        return value

    def validate_bio(self, value):
        """
        Validate bio:
        - Max length of 300 characters
        """
        if len(value) > 300:
            raise serializers.ValidationError("Bio cannot exceed 300 characters")
        return value

    def validate_email(self, value):
        """
        Validate email:
        - Format validation using Django's EmailValidator
        - Case insensitive uniqueness check
        """
        validator = EmailValidator()
        validator(value)

        if UserProfile.objects.filter(email__iexact=value).exclude(id=getattr(self.instance, 'id', None)).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value.lower()

    def validate(self, data):
        user = self.context.get('request').user

        if user.has_oauth:
            # Check if any field other than bio actually changed
            changed_fields = [
                field for field in ['username', 'email']
                if field in data and data[field] != getattr(user, field)
            ]

            if changed_fields:
                raise serializers.ValidationError(
                    "OAuth users can only update their bio"
                )

            # Remove unchanged fields to prevent unnecessary updates
            data = {'bio': data.get('bio')} if 'bio' in data else {}

        return data

    def update(self, instance, validated_data):
        if instance.has_oauth:
            # Only update bio for OAuth users
            if 'bio' in validated_data:
                instance.bio = validated_data['bio']
                instance.save(update_fields=['bio'])
            return instance

        return super().update(instance, validated_data)

class PasswordUpdateSerializer(serializers.Serializer):
    """
    A Django REST Framework serializer for handling password updates.

    This serializer validates and processes password update requests, ensuring:
    - The user is not an OAuth user
    - The new password and confirmation match
    - The new password meets Django's password validation requirements

    Fields:
        old_password (str): The user's current password
        new_password (str): The new password to set
        confirm_password (str): Confirmation of the new password

    Raises:
        ValidationError: If the user is an OAuth user, or if passwords don't match,
                        or if the new password doesn't meet validation requirements

    Context Required:
        request: The HTTP request object containing the authenticated user
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        user = self.context.get('request').user
        if user.has_oauth:
            raise serializers.ValidationError(
                "OAuth users cannot update their password"
            )

        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match"}
            )
        validate_password(data['new_password'])
        return data

class FriendSerializer(serializers.ModelSerializer):
    """
    A Django REST Framework serializer for the Friends model.

    This serializer handles the representation of friendship relationships between users,
    providing methods to serialize user-specific friendship data.

    Attributes:
        username (SerializerMethodField): The username of the friend (other user in the relationship)
        avatar (SerializerMethodField): The avatar URL of the friend
        id (SerializerMethodField): The user ID of the friend
        is_online (SerializerMethodField): Boolean indicating if the friend is currently online
        direction (SerializerMethodField): String indicating if the friendship was 'sent' or 'received'

    Methods:
        get_username(obj): Returns the username of the other user in the friendship
        get_avatar(obj): Returns the avatar URL of the other user
        get_id(obj): Returns the user ID of the other user
        get_is_online(obj): Returns the online status of the other user
        get_direction(obj): Returns whether the friendship was sent or received by the current user

    Meta:
        model: Friends
        fields: ['id', 'username', 'avatar', 'status', 'is_online', 'friends_since', 'direction']
    """
    username = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    direction = serializers.SerializerMethodField()

    class Meta:
        model = Friends
        fields = ['id', 'username', 'avatar', 'status', 'is_online', 'friends_since', 'direction']

    def get_username(self, obj):
        request = self.context.get('request')
        if request:
            # Return the other user's username, not the current user's
            if obj.user == request.user:
                return obj.friend.username
            return obj.user.username

    def get_avatar(self, obj):
        request = self.context.get('request')
        if request:
            other_user = obj.friend if obj.user == request.user else obj.user
            return other_user.avatar.url if other_user.avatar else None

    def get_id(self, obj):
        request = self.context.get('request')
        if request:
            other_user = obj.friend if obj.user == request.user else obj.user
            return other_user.id

    def get_is_online(self, obj):
        request = self.context.get('request')
        if request:
            other_user = obj.friend if obj.user == request.user else obj.user
            return other_user.is_online

    def get_direction(self, obj):
        request = self.context.get('request')
        if request:
            if obj.user == request.user:
                return 'sent'
            return 'received'
