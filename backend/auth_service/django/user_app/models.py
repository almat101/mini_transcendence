from django.db import models
from django.contrib.auth.models import AbstractUser

class UserProfile(AbstractUser):
    """Custom User Profile model extending Django's AbstractUser.

    This model extends Django's AbstractUser to include additional fields for user profiles
    in the application. It includes features for tracking online status, email verification,
    avatar management, 2FA authentication, and OAuth integration.

    Attributes:
        is_online (BooleanField): Tracks user's current online status.
        last_activity (DateTimeField): Records user's last activity timestamp.
        email (EmailField): User's email address (unique).
        email_is_verified (BooleanField): Email verification status.
        avatar (ImageField): User's profile picture, defaults to 'avatars/default_avatar.jpg'.
        bio (TextField): User's biography or description (max 500 chars).
        created_at (DateTimeField): Account creation timestamp.
        has_2fa (BooleanField): Two-factor authentication status.
        twofa_secret (CharField): Secret key for 2FA implementation.
        has_oauth (BooleanField): OAuth authentication status.
        USERNAME_FIELD (str): Field used for authentication (set to 'username').
        REQUIRED_FIELDS (list): Required fields for user creation ['email'].

    Methods:
        search_users(query, current_user): Class method to search users and their friendship status.
            Args:
                query (str): Search query for username matching.
                current_user (UserProfile): Current user instance for friendship context.
            Returns:
                QuerySet: Limited to 20 users with annotated friendship status.

        __str__(): String representation of the user profile.
            Returns:
                str: Username of the user.
    """
    # Online status tracking
    is_online = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True, blank=True)

    email = models.EmailField(unique=True)
    email_is_verified = models.BooleanField(default=False)

    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, default='avatars/default_avatar.jpg')
    bio = models.TextField(blank=True, max_length=500)

    created_at = models.DateTimeField(auto_now_add=True)

    email_otp = models.CharField(max_length=6, null=True, blank=True)
    email_verified = models.BooleanField(default=False)

    has_2fa = models.BooleanField(default=False)
    twofa_secret = models.CharField(max_length=255, blank=True, null=True)
    has_oauth = models.BooleanField(default=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    @classmethod
    def search_users(cls, query, current_user):
        """Search users by username with friendship status"""
        base_query = cls.objects.filter(
            models.Q(username__icontains=query),
        ).exclude(id=current_user.id)

        # Annotate friendship status with direction information
        users = base_query.annotate(
            friendship_status=models.Case(
                models.When(
                    models.Q(friend_requests_received__user=current_user, friend_requests_received__status='blocked') |
                    models.Q(friend_requests_sent__friend=current_user, friend_requests_sent__status='blocked'),
                    then=models.Value('blocked')
                ),
                models.When(
                    models.Q(friend_requests_received__user=current_user, friend_requests_received__status='accepted') |
                    models.Q(friend_requests_sent__friend=current_user, friend_requests_sent__status='accepted'),
                    then=models.Value('accepted')
                ),
                models.When(
                    models.Q(friend_requests_sent__friend=current_user, friend_requests_sent__status='pending'),
                    then=models.Value('pending_received')
                ),
                models.When(
                    models.Q(friend_requests_received__user=current_user, friend_requests_received__status='pending'),
                    then=models.Value('pending_sent')
                ),
                default=models.Value('none'),
                output_field=models.CharField(),
            )
        ).exclude(friendship_status='blocked').only('id', 'username', 'avatar', 'bio', 'is_online')[:20]

        return users

    def __str__(self):
        return self.username


class Friends(models.Model):
    """
    A Django model representing friendship relationships between users.

    This model manages friend requests and friendships between UserProfile instances,
    tracking their status and creation time.

    Attributes:
        FRIENDS_STATUS (list): List of tuples defining possible friendship statuses:
            - ('pending', 'Pending'): Friend request sent but not accepted
            - ('accepted', 'Accepted'): Friendship established
            - ('blocked', 'Blocked'): User has blocked the friend
        user (ForeignKey): The UserProfile who initiated the friend request
        friend (ForeignKey): The UserProfile who received the friend request
        status (CharField): Current status of the friendship/request
        friends_since (DateTimeField): Timestamp when the friend request was created

    Meta:
        unique_together: Ensures unique combinations of user and friend
        constraints: Prevents self-friendships through CheckConstraint

    Note:
        The model enforces that users cannot friend themselves through the
        'no_self_friendship' constraint.
    """
    FRIENDS_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked')
    ]

    user = models.ForeignKey(
        UserProfile,
        related_name='friend_requests_sent',
        on_delete=models.CASCADE
    )
    friend = models.ForeignKey(
        UserProfile,
        related_name='friend_requests_received',
        on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=20,
        choices=FRIENDS_STATUS,
        default='pending'
    )
    friends_since = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')
        constraints = [
            models.CheckConstraint(
                check=~models.Q(user=models.F('friend')),
                name='no_self_friendship'
            )
        ]
