from django.urls import re_path
from . import consumers as config_consumers
from room import consumers as room_consumers

websocket_urlpatterns = [
    re_path(r'ws/test/$', config_consumers.TestConsumer.as_asgi()), #route for testing, use /ws/ for websocket routes 
    re_path(r'ws/room/(?P<room_id>[0-9a-f-]+)/$', room_consumers.RoomConsumer.as_asgi()),
]