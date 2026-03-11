import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message

class RoomConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id'] #obtain room url give scope for info
        self.room_group_name = f'room_{self.room_id}'
        self.user = self.scope['user']

        #reject unauthenticated users
        if not self.user.is_authenticated:
            await self.close()
            return

        #join room group
        await self.channel_layer.group_add(self.room_group_name,self.channel_name)
        await self.accept()

        #Add user to presence set in channel layer
        if not hasattr(self.channel_layer, 'presence'):
            self.channel_layer.presence = {}
        if self.room_group_name not in self.channel_layer.presence:
            self.channel_layer.presence[self.room_group_name] = set()
        self.channel_layer.presence[self.room_group_name].add(self.user.username)

        #Broadcast updated presence list to everyone in room
        await self.broadcast_presence()

        #Announce user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'system_message',
                'message': f'{self.user.username} joined the room'
            }
        )

    async def disconnect(self, close_code):
        #Remove from presence
        if (hasattr(self.channel_layer, 'presence') and
                self.room_group_name in self.channel_layer.presence):
            self.channel_layer.presence[self.room_group_name].discard(self.user.username)

            #Clean up empty rooms
            if not self.channel_layer.presence[self.room_group_name]:
                del self.channel_layer.presence[self.room_group_name]
            else:
                await self.broadcast_presence()

        #Announce user left
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'system_message',
                'message': f'{self.user.username} left the room'
            }
        )

        await self.channel_layer.group_discard(self.room_group_name,self.channel_name)

    #join leave annoucements 
    async def system_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system_message',
            'message': event['message'],
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'users': event['users'],
        }))

    #helper
    async def broadcast_presence(self):
        users = list(
            self.channel_layer.presence.get(self.room_group_name, set())
        )
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'users': users,
            }
        )
