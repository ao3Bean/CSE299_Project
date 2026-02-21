from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    hair = models.CharField(max_length=50, default="Default Hair")

    face_expression = models.CharField(max_length=50, default="Neutral")

    clothes = models.CharField(max_length=50, default="Default Clothes")

    skin_color = models.CharField(max_length=50, default="Medium")

    def __str__(self):
        return self.user.username


#for the chat room model: 
class Room(models.Model):

    ROOM_TYPE_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]

    name = models.CharField(max_length=100)

    room_type = models.CharField(
        max_length=10,
        choices=ROOM_TYPE_CHOICES,
        default='public'
    )

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
# Create your models here.
