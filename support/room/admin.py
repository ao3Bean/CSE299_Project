from django.contrib import admin
from .models import Room, Message, Session

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'host', 'is_private', 'is_saved', 'created_at', 'expires_at']
    list_filter = ['is_private', 'is_saved']
    search_fields = ['name']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'room', 'content', 'timestamp']

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['room', 'start_time', 'is_active']