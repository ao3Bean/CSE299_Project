from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    hair = models.CharField(max_length=50, default="Default Hair")

    face_expression = models.CharField(max_length=50, default="Neutral")

    clothes = models.CharField(max_length=50, default="Default Clothes")

    skin_color = models.CharField(max_length=50, default="Medium")
    
     
    # ── NEW: profile info fields ──
    hobbies         = models.CharField(max_length=500, default="")
    focus_goal      = models.CharField(max_length=200, default="")

    def __str__(self):
        return self.user.username

# for calendar (task-> to-do list)
class Task(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE)
    title       = models.CharField(max_length=200)
    date        = models.DateField()
    is_complete = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.date})"


