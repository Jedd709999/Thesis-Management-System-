from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from api.models import Document

import json
import logging

logger = logging.getLogger(__name__)

class DocumentEditConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time document collaboration"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.document_group_name = f'doc_{self.document_id}'
        
        # Join document group
        await self.channel_layer.group_add(
            self.document_group_name,
            self.channel_name
        )
        
        # Store user info
        self.user = self.scope.get('user')
        if self.user and self.user.is_authenticated:
            self.user_info = {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name
            }
        else:
            self.user_info = {'id': None, 'username': 'Anonymous'}
        
        await self.accept()
        
        # Notify others that user joined
        await self.channel_layer.group_send(
            self.document_group_name,
            {
                'type': 'user_joined',
                'user': self.user_info
            }
        )
        
        # Send current document state
        await self.send_document_state()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave document group
        await self.channel_layer.group_discard(
            self.document_group_name,
            self.channel_name
        )
        
        # Notify others that user left
        await self.channel_layer.group_send(
            self.document_group_name,
            {
                'type': 'user_left',
                'user': self.user_info
            }
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'text_change':
                await self.handle_text_change(data)
            elif message_type == 'cursor_position':
                await self.handle_cursor_position(data)
            elif message_type == 'selection_change':
                await self.handle_selection_change(data)
            elif message_type == 'format_change':
                await self.handle_format_change(data)
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_text_change(self, data):
        """Handle text editing changes"""
        try:
            change_data = {
                'type': 'text_change',
                'user': self.user_info,
                'operation': data.get('operation'),  # insert, delete, replace
                'position': data.get('position'),
                'content': data.get('content', ''),
                'length': data.get('length', 0),
                'timestamp': data.get('timestamp')
            }
            
            # Broadcast to all users in document
            await self.channel_layer.group_send(
                self.document_group_name,
                change_data
            )
            
            # Optionally save to database
            await self.save_change_to_document(change_data)
            
        except Exception as e:
            logger.error(f"Error handling text change: {e}")
    
    async def handle_cursor_position(self, data):
        """Handle cursor position updates"""
        cursor_data = {
            'type': 'cursor_position',
            'user': self.user_info,
            'position': data.get('position'),
            'timestamp': data.get('timestamp')
        }
        
        await self.channel_layer.group_send(
            self.document_group_name,
            cursor_data
        )
    
    async def handle_selection_change(self, data):
        """Handle text selection changes"""
        selection_data = {
            'type': 'selection_change',
            'user': self.user_info,
            'start': data.get('start'),
            'end': data.get('end'),
            'timestamp': data.get('timestamp')
        }
        
        await self.channel_layer.group_send(
            self.document_group_name,
            selection_data
        )
    
    async def handle_format_change(self, data):
        """Handle text formatting changes"""
        format_data = {
            'type': 'format_change',
            'user': self.user_info,
            'start': data.get('start'),
            'end': data.get('end'),
            'format': data.get('format'),
            'timestamp': data.get('timestamp')
        }
        
        await self.channel_layer.group_send(
            self.document_group_name,
            format_data
        )
        
        # Save formatting to Google Docs
        await self.save_format_to_google_docs(format_data)
    
    async def user_joined(self, event):
        """Handle user joined notification"""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user']
        }))
    
    async def user_left(self, event):
        """Handle user left notification"""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user': event['user']
        }))
    
    async def text_change(self, event):
        """Handle text change broadcast"""
        # Don't send back to sender
        if event['user']['id'] != self.user_info['id']:
            await self.send(text_data=json.dumps(event))
    
    async def cursor_position(self, event):
        """Handle cursor position broadcast"""
        # Don't send back to sender
        if event['user']['id'] != self.user_info['id']:
            await self.send(text_data=json.dumps(event))
    
    async def selection_change(self, event):
        """Handle selection change broadcast"""
        # Don't send back to sender
        if event['user']['id'] != self.user_info['id']:
            await self.send(text_data=json.dumps(event))
    
    async def format_change(self, event):
        """Handle format change broadcast"""
        # Don't send back to sender
        if event['user']['id'] != self.user_info['id']:
            await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def send_document_state(self):
        """Send current document state to newly connected user"""
        try:
            document = Document.objects.get(id=self.document_id)
            
            # Send document metadata
            import asyncio
            asyncio.create_task(self.send(text_data=json.dumps({
                'type': 'document_state',
                'document': {
                    'id': document.id,
                    'title': document.thesis.title if document.thesis else 'Untitled',
                    'google_doc_url': document.google_doc_url,
                    'provider': document.provider
                }
            })))
            
        except ObjectDoesNotExist:
            logger.error(f"Document {self.document_id} not found")
        except Exception as e:
            logger.error(f"Error sending document state: {e}")
    
    @database_sync_to_async
    def save_change_to_document(self, change_data):
        """Save changes to document (for conflict resolution)"""
        try:
            # This could be implemented to save change history
            # For now, we'll just log it
            logger.info(f"Document change saved: {change_data}")
        except Exception as e:
            logger.error(f"Error saving change: {e}")
    
    @database_sync_to_async
    def save_format_to_google_docs(self, format_data):
        """Save formatting changes to Google Docs"""
        try:
            from ..services.google_docs_service import google_docs_service
            
            document = Document.objects.get(id=self.document_id)
            if document.google_doc_url and document.provider == 'google':
                doc_id = google_docs_service.extract_document_id_from_url(document.google_doc_url)
                if doc_id:
                    # Apply formatting to Google Docs
                    text_style = format_data.get('format', {})
                    google_docs_service.format_text(
                        doc_id, 
                        format_data['start'], 
                        format_data['end'], 
                        text_style
                    )
        except Exception as e:
            logger.error(f"Error saving format to Google Docs: {e}")
