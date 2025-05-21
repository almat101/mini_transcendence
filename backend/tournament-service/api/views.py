from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import User
from .serializer import UserSerializer
from .models import Post
from .serializer import PostSerializer
from . import matchmaking, debug_print

#this imports are only for the favicon
from django.views.decorators.http import require_GET
from django.http import HttpResponse
import os
#* for next time:
#* i need to change the get to have the matchmaking be there instead of
#* the post function to be able to get the users and matchmake them and give it
#* to the frontend
#* because if you think about it POST is for adding them to the db and then
#* with GET we can get the users and matchmake them and then DELETE them
#* [X] DONE :)

#the idea is:
#how many users play?
#n users ok -> post method to add the users to the db
#! case of odd users hadled [X] :)
#in the front end the users will play
#i send the losers with a delete request deleting the users from the
#matchmaking database
#i repeat the steps until there's a winner
@api_view(['GET'])
def get_users_tournament(request):
	print('\033[32mready to get the users \033[0m')
	users = list(User.objects.all())
	# serializer = UserSerializer(users, many=True)
	print(len(users))
	if (len(users) % 2 != 0):
		print("\033[31modd number of users \033[0m")
		users = matchmaking.remove_user_temporarily(users)

	matchmaked_users = matchmaking.matchmaking(users)
	debug_print.debug_print_user_matchmaking(matchmaked_users)
	# serializer = UserSerializer(matchmaked_users, many=True)
	# debug_print.debug_print_user_matchmaking(users)
	# debug_print.printUserDb()
	matches = matchmaking.pair_users(matchmaked_users)
	print(f'\033[34mMatched Pairs: {matches}\033[0m')
	return Response(matches, status=status.HTTP_200_OK)

#view to save multiple users in case of tournament case
#until now i haven't worked with databases in django
#those datas will be put in the user model (table)
#the serialized data goes back to the frontend
#the frontend will use this data to display the users
#response expects single list of user


#! if you think about it, the post request is needed
#! only once to add the users to the db and that's it
#! and that time is when in the front end we create the tournament option

#in this case te request are the users to put in the db
@api_view(['POST'])
def	save_user_for_tournament(request):
	# Expecting a JSON array of names: {"names": ["Alice", "Bob", "Charlie"]}
	print('\033[32m ready to save the usernames passed in the tournament \033[0m')
	print(request.data)

	names = request.data.get('names', [])
	print(names)

	if not isinstance(names, list):
		return Response({'error': 'Names must be a list'}, status=status.HTTP_400_BAD_REQUEST)

	saved_users = []
	for name in names:
		if names.count(name) > 1:
			print(f'\033[41mDuplicate name detected: {name}\033[0m')
			User.objects.all().delete() #seeing that the tournament won't start i delete the db

			#!added for testing out in case the microservice work strangely delete it
			# delete_all_users()

			return Response({'error': f'Duplicate name detected: {name}.'}, status=status.HTTP_400_BAD_REQUEST)


		# Create User instances
		# and i save them in their db
		# so if i remove one it won't be much of a hassle
		user, created = User.objects.get_or_create(name=name)
		if created:
			print(f'\033[42mCreated user {user.name}\033[0m')
		else:
			print(f'\033[41mUser {user.name} already exists\033[0m')
			User.objects.all().delete() #seeing that the tournament won't start i delete the db
			return Response({'error': f'Duplicate name detected: {name}.'}, status=status.HTTP_400_BAD_REQUEST)
		saved_users.append(user)

	serializer = UserSerializer(saved_users, many=True)
	return Response(serializer.data, status=status.HTTP_201_CREATED)

class PostList(APIView):
	def get(self, request):
		posts = Post.objects.all()
		serializer = PostSerializer(posts, many=True)
		return Response(serializer.data)


#DELETE http request to change the database
#*based on who won the match
#*the request is surely the players who lost the match
@api_view(['DELETE'])
def update_match_winner(request):
	# Expecting a JSON array of names: {"names": ["Alice", "Bob"]}
	print('\033[32m ready to update the match winner \033[0m')
	print(request.data)

	names = request.data.get('names', [])
	print(names)

	if not isinstance(names, list):
		return Response({'error': 'Names must be a list'}, status=status.HTTP_400_BAD_REQUEST)

	# Get the users from the database
	# and from the name that i have gotten delete the user from the db
	for name in names:
		try:
			user = User.objects.get(name=name)
			print(f'\033[41mDeleted user {user.name}\033[0m')
			user.delete()
		except User.DoesNotExist:
			return Response({'error': f'User {name} does not exist'}, status=status.HTTP_404_NOT_FOUND)

	# Return the updated users
	users = User.objects.all()
	serializer = UserSerializer(users, many=True)
	return Response(serializer.data, status=status.HTTP_200_OK)

#handling the favicon request error
@require_GET
def favicon(request):
	favicon_path = os.path.join(os.path.dirname(__file__), 'favicon.ico')
	if os.path.exists(favicon_path):
		with open(favicon_path, 'rb') as f:
			return HttpResponse(f.read(), content_type='image/x-icon')
	return HttpResponse(status=204)  # No Content if favicon doesn't exist

@api_view(['DELETE'])
def delete_all_users(request):
	print('\033[41mDELETING ALL THE REMAINING USERS	\033[0m')
	User.objects.all().delete()
	return Response({"message": "All users deleted"})

@api_view(['GET'])
def list_all_users(request):
	"""
	Retrieves all users currently in the tournament.
	"""
	print("\033[33m taking the list of users...\033[0m")
	users = User.objects.all()
	serializer = UserSerializer(users, many=True)
	return Response(serializer.data, status=status.HTTP_200_OK)
