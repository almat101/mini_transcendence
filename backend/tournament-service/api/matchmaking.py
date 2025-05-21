from .models import User
import random

#what is actually passed here is a queryset
#that's what the models are for
#the models are the tables in the database
#i need to make the changes permanent
def matchmaking(users):
	print("testing out the tables theory of django")
	#i need to convert the queryset to a list
	if isinstance(users, list) == False:
		users = list(users)
	random.shuffle(users)
	# clear_users()
	return (users)

#num_of_players is how big the list of users is
#the function will pull out two players cyclically
#until it reaches the number of players / 2
#after two players gets out it will erase them from the list
#to avoid repetition
#handle the case of odd number of players [not implemented]


#function to empty up the databse of users
def clear_users():
	User.objects.all().delete()
	print('deleted all users')

#for the future a function to add the user
#to the list of users from the database


#function to remove a user from the list
#pop is for the list and delete is for the databse ok :)
#damn with delete we are just removing the user from
#the db not from the actual list and i wanted to avoid that
#honestly
def	remove_user_temporarily(saved_users):
	usr_index = random.randrange(0, len(saved_users))
	#remove the user from the list
	print("\033[31mremoving user " + saved_users[usr_index].name + "\033[0m")

	saved_users.pop(usr_index)

	for user in saved_users:
		print("\033[34m" + user.name + "\033[0m")

	return saved_users

def pair_users(users):
	return [{'player1': users[i].name, 'player2': users[i + 1].name}
			for i in range(0, len(users), 2)]
