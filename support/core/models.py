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


    # ── NEW: profile picture selection ──
    profile_pic     = models.CharField(max_length=100, default="profile_pic.png")

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

#for friends page:
class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
    ]
    from_user  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    to_user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    is_seen    = models.BooleanField(default=False)  # ← NEW: track if receiver has seen the request

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user.username} → {self.to_user.username} ({self.status})"


class RoomLinkMessage(models.Model):
    sender    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_links')
    receiver  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_links')
    room_link = models.URLField(max_length=500)
    sent_at   = models.DateTimeField(auto_now_add=True)
    is_read   = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username}: {self.room_link}"