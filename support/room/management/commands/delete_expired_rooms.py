from django.core.management.base import BaseCommand
from django.utils import timezone
from room.models import Room

# all custom commands must inherit base command to mke it runnable
class Command(BaseCommand): # custom command to delete expired rooms
    help = 'Deletes unsaved rooms that have passed their expiry time'

    def handle(self, *args, **kwargs): #find all rooms that are not saved and have expired, count them, delete them, and print how many were deleted
        expired = Room.objects.filter(
            is_saved=False,
            expires_at__lt=timezone.now()
        )
        count = expired.count()
        expired.delete()
        self.stdout.write(f'Deleted {count} expired rooms')