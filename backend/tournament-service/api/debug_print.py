from .models import User

def debug_print_user_matchmaking(list_of_users):
	i = 0
	print("\033[42m\033[3mThe matchmaking has been done!!\033[0m")
	while i < len(list_of_users) and len(list_of_users) % 2 == 0:
		print("\033[33mUser " + str(i + 1) + " name: " + list_of_users[i].name)
		print ("\nis going against user "+ str(i + 2) + " " + list_of_users[i + 1].name+"\033[0m")
		i += 2

def printUserDb():
	users = User.objects.all()
	print("\033[35mchecking db status....\033[0m")
	print("\033[32m\033[1mPrinting all users in the database\033[0m")
	for user in users:
		print(user.name)
