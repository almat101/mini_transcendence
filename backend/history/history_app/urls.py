from django.urls import path
# from .views import MatchCreateView
from . import views

urlpatterns = [
    #local 1vs1
    path('match/create', views.create_match , name='create_match'),
    path('match/', views.get_match , name='get_match'),
    path('match/<int:player1_id>/', views.get_match_by_player, name='get_match_by_player'),
    #tournament
    path('tournament/create', views.create_match_tournament, name='create_match_tournament' ),
    path('tournament/', views.get_match_tournament, name='get_match_tournament' ),
    path('tournament/<int:player1_id>/', views.get_match_tournament_by_player, name='get_match_tournament_by_player'),
    path('tournament/<int:tournamentId>/update/', views.update_match_tournament, name='update_match_tournament'),
    path('tournament/cleanup/', views.cleanup_invalid_tournaments, name='cleanup_invalid_tournaments'),
]
