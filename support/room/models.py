from django.db import models
import uuid

from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Room(models.Model):
    #will stay default for all rooms, but can be changed by host when saving rooms
    room_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=200, blank=True, default="")
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name="hosted_rooms")
    is_private = models.BooleanField(default=False)
    passcode = models.CharField(max_length=20, blank=True, null=True)

    #user customizable settings, will stay default for all rooms, but can be changed by host when saving rooms
    background_preset = models.CharField(max_length=50, default="img1")
    focus_duration = models.IntegerField(default=25)
    break_duration = models.IntegerField(default=5)
    is_saved = models.BooleanField(default=False) #will change to false later, for testing only
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    max_participants = models.IntegerField(default=8)

    def save(self, *args, **kwargs):
        if self.pk is None and not self.expires_at:
        # Only set expiry on first creation
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


#for user chatting
class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(max_length=500)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:40]}"


class Session(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="sessions")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions", null=True, blank=True)  
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        username = self.user.username if self.user else "unknown"
        return f"Session by {username} in {self.room.name} ({self.start_time:%Y-%m-%d %H:%M})"
    
class RoomMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="memberships")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "room")

    def __str__(self):
        return f"{self.user.username} in {self.room.name}"