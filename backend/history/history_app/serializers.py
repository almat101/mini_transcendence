from rest_framework import serializers
from .models import Match_local
from .models import Match_tournament

#* serializer is used to convert models into JSON data
#* JSON can be easily transmitted over the web
#* 1. a match is over the serializer convert the models into JSON
#* 2. the data are sent over HTTP
#* 3. the history microservice deserialize the JSON into a models

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match_local
        fields = '__all__'

class MatchSerializerTournament(serializers.ModelSerializer):
    class Meta:
        model = Match_tournament
        fields = '__all__'
