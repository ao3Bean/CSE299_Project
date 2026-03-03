from django.urls import path
from . import views    

urlpatterns = [
    path('rooms/', views.rooms_view, name='rooms'),
    path('room/<uuid:room_id>/', views.chatroom_view, name='chatroom'), 
    path('community/', views.community_view, name='community'),
    # path('chatroom/', views.chatroom, name='chatroom'),
    path('room/create/', views.create_room, name='create_room'),
    path('rooms/<uuid:room_id>/save/', views.save_room, name='save_room'),
]