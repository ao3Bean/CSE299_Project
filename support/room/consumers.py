import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message

class RoomConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id'] #obtain room url give scope for info
        self.room_group_name = f'room_{self.room_id}'
        self.user = self.scope['user']

        if not hasattr(self.channel_layer, 'presence'): #initialise here for max participants check
            self.channel_layer.presence = {}

        #reject unauthenticated users
        if not self.user.is_authenticated:
            await self.close()
            return


        # Check max participants before accepting
        # TODO - fix max participant check
        # room = await self.get_room()
        # current_count = len(self.channel_layer.presence.get(self.room_group_name, set()))
        # if current_count >= room.max_participants:
        #     await self.close(code=4003)  # custom close code for "room full"
        #     return

        #join room group
        await self.channel_layer.group_add(self.room_group_name,self.channel_name)
        await self.accept()

        #Add user to presence set in channel layer
        
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

    #Chat message handlerS
    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')

        if msg_type == 'chat_message':
            message = data.get('message', '').strip()
            if not message:
                return
            await self.save_message(message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': self.user.username,
                }
            )

    #handlers for messages sent to the group
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'username': event['username'],
        }))

    @database_sync_to_async
    def save_message(self, content):
        room = Room.objects.get(room_id=self.room_id)
        Message.objects.create(
            room=room,
            sender=self.user,
            content=content
        )
    
    @database_sync_to_async
    def get_room(self):
        return Room.objects.get(room_id=self.room_id)