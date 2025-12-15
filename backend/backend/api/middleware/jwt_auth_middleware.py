import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    """Get user from JWT token"""
    try:
        logger.info(f"Attempting to decode JWT token: {token[:20]}...")
        # Decode the token
        decoded_data = AccessToken(token)
        user_id = decoded_data['user_id']
        logger.info(f"Token decoded successfully, user_id: {user_id}")
        
        # Get the user
        user = User.objects.get(id=user_id)
        logger.info(f"User found: {user}")
        return user
    except Exception as e:
        logger.error(f"Error decoding JWT token: {e}")
        return None

class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens
    """
    
    async def __call__(self, scope, receive, send):
        logger.info("JWTAuthMiddleware called")
        logger.info(f"Scope keys: {list(scope.keys())}")
        logger.info(f"Query string: {scope.get('query_string', b'')}")
        
        # Get query parameters from the WebSocket URL
        query_string = scope.get("query_string", b"")
        logger.info(f"Raw query string: {query_string}")
        
        if query_string:
            try:
                query_params = parse_qs(query_string.decode())
                logger.info(f"Parsed query params: {query_params}")
                token = query_params.get("token", [None])[0]
            except Exception as e:
                logger.error(f"Error parsing query string: {e}")
                token = None
        else:
            token = None
        
        logger.info(f"Token from query params: {token}")
        
        if token:
            # Authenticate user with JWT token
            user = await get_user_from_token(token)
            if user is None:
                # Invalid token, close connection with specific code
                logger.info("Invalid token, closing connection with code 4001")
                return await self.close_connection(scope, receive, send, code=4001)
            logger.info(f"User authenticated: {user}")
            scope["user"] = user
        else:
            # No token provided, close connection with specific code
            logger.info("No token provided, closing connection with code 4001")
            return await self.close_connection(scope, receive, send, code=4001)
            
        logger.info("Calling super().__call__")
        return await super().__call__(scope, receive, send)
    
    async def close_connection(self, scope, receive, send, code=4001):
        """Close WebSocket connection with specific code"""
        logger.info(f"Closing WebSocket connection with code: {code}")
        # Create a simple ASGI application that closes the connection
        async def app(scope, receive, send):
            await send({
                "type": "websocket.close",
                "code": code
            })
        return await app(scope, receive, send)