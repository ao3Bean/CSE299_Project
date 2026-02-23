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


