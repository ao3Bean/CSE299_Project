from django.db import models
import uuid
from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Room(models.Model):
    ROOM_TYPE_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]

    room_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=100)

    room_type = models.CharField(
        max_length=10,
        choices=ROOM_TYPE_CHOICES,
        default='public'
    )

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    expires_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=2)  # adjust if needed
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name