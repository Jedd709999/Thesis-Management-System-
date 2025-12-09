import threading
import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import logout

logger = logging.getLogger(__name__)

# Thread-local storage for audit information
_thread_locals = threading.local()

class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to capture user and request information for audit logging.
    """
    
    def process_request(self, request):
        """
        Store the current user and request information in thread-local storage.
        """
        # Store the current user
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                # Force evaluation of user to catch UUID conversion errors
                _ = request.user.pk
                _thread_locals.audit_user = request.user
            except Exception:
                # Handle case where session contains old integer ID but model uses UUID
                # Clear the session to prevent repeated errors
                if hasattr(request, 'session'):
                    request.session.flush()
                _thread_locals.audit_user = None
        else:
            _thread_locals.audit_user = None
            
        # Store request metadata
        _thread_locals.audit_ip = self._get_client_ip(request)
        _thread_locals.audit_user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        _thread_locals.audit_path = request.path
        
        return None
    
    def process_response(self, request, response):
        """
        Clean up thread-local storage after the request is processed.
        """
        self._clear_thread_locals()
        return response
    
    def process_exception(self, request, exception):
        """
        Clean up thread-local storage if an exception occurs.
        """
        self._clear_thread_locals()
        return None
    
    def _clear_thread_locals(self):
        """
        Clear thread-local storage to prevent data leakage between requests.
        """
        if hasattr(_thread_locals, 'audit_user'):
            delattr(_thread_locals, 'audit_user')
        if hasattr(_thread_locals, 'audit_ip'):
            delattr(_thread_locals, 'audit_ip')
        if hasattr(_thread_locals, 'audit_user_agent'):
            delattr(_thread_locals, 'audit_user_agent')
        if hasattr(_thread_locals, 'audit_path'):
            delattr(_thread_locals, 'audit_path')
    
    def _get_client_ip(self, request):
        """
        Get the client IP address from the request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

def get_current_user():
    """
    Get the current user from thread-local storage.
    """
    return getattr(_thread_locals, 'audit_user', None)

def get_current_ip():
    """
    Get the current IP address from thread-local storage.
    """
    return getattr(_thread_locals, 'audit_ip', None)

def get_current_user_agent():
    """
    Get the current user agent from thread-local storage.
    """
    return getattr(_thread_locals, 'audit_user_agent', None)

def get_current_path():
    """
    Get the current request path from thread-local storage.
    """
    return getattr(_thread_locals, 'audit_path', None)
