from django.urls import path, include
from .views import get_users_tournament
from .views import PostList
from .views import save_user_for_tournament, update_match_winner, delete_all_users
from .views import list_all_users, favicon
#we doing different operations that involves tables in the database
#we need to create a url for each operation
#!remove favicon settings is no longer useful
urlpatterns = [
	path('users/', get_users_tournament, name='get_users'),
	path('users/save/', save_user_for_tournament, name='save_user_for_tournament'),
	path('users/delete/', update_match_winner, name='update_match_winner'),
	path('users/delete_all/', delete_all_users, name='delete_all_users'),
	path('users/list/', list_all_users, name='list_all_users'),
	path('favicon.ico', favicon, name='favicon'),
]

