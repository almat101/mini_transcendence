from django.db import models

# Create your models here
# model to handle user data
class User(models.Model):
	# age = models.IntegerField()
	name = models.CharField(max_length=100, unique=True)
	# is_matched = models.BooleanField(default=False)
	def __str__(self):
		return self.name

#For myself testing out
class Post(models.Model):
	title = models.CharField(max_length=100)
	content = models.TextField()
	create_at = models.DateTimeField(auto_now_add=True)
	def __str__(self):
		return self.title


#! fare un altro backend chiamato match_history per storare i dati di tutte le partite
# game è da fare per il gioco da remoto con i webchannels
# questi due sono possiamo dire indipendenti uno dall'altro
# view, per l'utente loggato, user/getuserinfo -> ritorna,
#player1 è quello che prendi
#game modello, player1(sempre quello loggato), player2, datapartita, winner
#modello locale 1vs1
#modello torneo:
#user_loggato, num_utenti, posizione_finale
#quindi i vari servizi saranno dei django startproject
#modelli per la gestione della match history

#1vs1 utente loggato pure deve essere sostituito al posto di player1
