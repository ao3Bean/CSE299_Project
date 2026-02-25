from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/test/$', consumers.TestConsumer.as_asgi()), #route for testing, use /ws/ for websocket routes 
]