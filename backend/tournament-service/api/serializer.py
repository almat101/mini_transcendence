#only with the rest_framework we can use the serializers
#django does not have a serializer or something like that
from rest_framework import serializers
from .models import User
from .models import Post

# here we translate some model into data
#simply it converts the data into json format
#! the meta class
#* pratically it's purpose is to handle the serializations of the
#* models into json format
#* the model variable is the model that we want to serialize
#* and the fields are the fields we want to serialize
class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = '__all__'
		
	def validate_name(self, value):
		if User.objects.filter(name=value):
			raise serializers.ValidationError("Name is too short")
		return value

	def check_name(self, value):
		if User.objects.filter(name=value).exists():
			raise serializers.ValidationError("User with this name already exists.")
		return value

class PostSerializer(serializers.ModelSerializer):
	class Meta:
		model = Post
		fields = '__all__'

