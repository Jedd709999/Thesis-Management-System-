from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from api.models.notification_models import Notification
import json
import logging

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notification updates"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        logger.info("NotificationConsumer.connect() called")
        # Get user from scope
        self.user = self.scope.get('user')
        logger.info(f"User from scope: {self.user}")
        
        # Check if user is authenticated
        if not self.user or not self.user.is_authenticated:
            logger.info("User not authenticated, closing connection with code 4001")
            await self.close(code=4001)
            return
        
        # Create a group name for this user's notifications
        self.notification_group_name = f'notifications_{self.user.id}'
        logger.info(f"Notification group name: {self.notification_group_name}")
        
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connection established for user {self.user.id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"NotificationConsumer.disconnect() called with close_code: {close_code}")
        # Leave notification group
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
        logger.info(f"WebSocket connection closed for user {self.user.id if hasattr(self, 'user') else 'unknown'}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe':
                await self.handle_subscription(data)
            elif message_type == 'unsubscribe':
                await self.handle_unsubscription(data)
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_subscription(self, data):
        """Handle subscription requests"""
        # Currently just acknowledge subscription
        await self.send(text_data=json.dumps({
            'type': 'subscription_confirmed',
            'message': 'Subscribed to notifications'
        }))
    
    async def handle_unsubscription(self, data):
        """Handle unsubscription requests"""
        # Currently just acknowledge unsubscription
        await self.send(text_data=json.dumps({
            'type': 'unsubscription_confirmed',
            'message': 'Unsubscribed from notifications'
        }))
    
    async def notification_created(self, event):
        """Handle notification creation broadcast"""
        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification_created',
            'notification': event['notification']
        }))
    
    async def notification_updated(self, event):
        """Handle notification update broadcast"""
        # Send notification update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification_updated',
            'notification': event['notification']
        }))
    
    async def notification_deleted(self, event):
        """Handle notification deletion broadcast"""
        # Send notification deletion to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification_deleted',
            'notification_id': event['notification_id']
        }))

    @database_sync_to_async
    def get_user_notifications(self):
        """Get user's notifications"""
        try:
            return list(Notification.objects.filter(recipient=self.user).values())
        except Exception as e:
            logger.error(f"Error fetching user notifications: {e}")
            return []