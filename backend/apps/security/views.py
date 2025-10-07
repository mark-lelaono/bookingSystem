"""
Security API views for ICPAC Booking System
"""
import logging

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail

from .models import AllowedEmailDomain, LoginAttempt, AuditLog, OTPToken
from .serializers import OTPTokenSerializer, AuditLogSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class GenerateOTPView(APIView):
    """
    Generate OTP for user authentication
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        token_type = request.data.get('token_type', 'two_factor')
        
        # Guard against missing delivery channel
        if not user.email:
            logger.warning("OTP requested for user %s without an email address", user.pk)
            return Response(
                {'error': 'No email address on file. Please contact an administrator.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create OTP token
        otp_token = OTPToken.create_otp(
            user=user,
            token_type=token_type,
            expires_in_minutes=10
        )
        
        # Log the action
        AuditLog.log_action(
            user=user,
            action_type='other',
            description=f'OTP generated for {token_type}',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Deliver OTP via email
        subject = f"{settings.EMAIL_SUBJECT_PREFIX}One-Time Password"
        expires_local = timezone.localtime(otp_token.expires_at)
        message = (
            f"Hello {user.get_full_name() or user.email},\n\n"
            f"Your verification code is: {otp_token.token}\n"
            f"It expires at {expires_local.strftime('%Y-%m-%d %H:%M %Z')}.\n\n"
            "If you did not request this code, please contact the ICPAC IT team immediately.\n\n"
            "ICPAC Booking System"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as exc:  # pragma: no cover - depends on SMTP
            logger.exception("Failed to send OTP email to %s: %s", user.email, exc)
            return Response(
                {'error': 'Failed to deliver the OTP email. Please try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        response_data = {
            'message': 'OTP generated successfully',
            'expires_at': otp_token.expires_at,
            'email_sent': True,
        }
        if settings.DEBUG:
            response_data['token'] = otp_token.token

        return Response(response_data)


class VerifyOTPView(APIView):
    """
    Verify OTP token
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        provided_token = request.data.get('token')
        token_type = request.data.get('token_type', 'two_factor')
        
        if not provided_token:
            return Response(
                {'error': 'OTP token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the latest valid OTP token
        try:
            otp_token = OTPToken.objects.filter(
                user=user,
                token_type=token_type,
                is_used=False
            ).latest('created_at')
        except OTPToken.DoesNotExist:
            return Response(
                {'error': 'No valid OTP token found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the token
        if otp_token.verify(provided_token):
            # Log successful verification
            AuditLog.log_action(
                user=user,
                action_type='other',
                description=f'OTP verified successfully for {token_type}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'OTP verified successfully'})
        else:
            # Log failed verification
            AuditLog.log_action(
                user=user,
                action_type='security_violation',
                description=f'Failed OTP verification for {token_type}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response(
                {'error': 'Invalid or expired OTP token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class CheckDomainView(APIView):
    """
    Check if email domain is allowed for registration
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_allowed = AllowedEmailDomain.is_domain_allowed(email)
        domain_info = AllowedEmailDomain.get_domain_info(email)
        
        return Response({
            'allowed': is_allowed,
            'requires_approval': domain_info.requires_approval if domain_info else False,
            'domain_description': domain_info.description if domain_info else None
        })


class RecordLoginAttemptView(APIView):
    """
    Record login attempts for security monitoring
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        attempt_type = request.data.get('attempt_type', 'failed_password')
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to find the user
        user = None
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            pass
        
        # Record the attempt
        LoginAttempt.record_attempt(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            attempt_type=attempt_type,
            user=user
        )
        
        # Check if IP or user is blocked
        ip_blocked = LoginAttempt.is_ip_blocked(ip_address)
        user_blocked = LoginAttempt.is_user_blocked(email)
        
        return Response({
            'recorded': True,
            'ip_blocked': ip_blocked,
            'user_blocked': user_blocked
        })


class AuditLogListView(ListAPIView):
    """
    List audit logs (admin only)
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user if specified
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action type if specified
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filter by date range if specified
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
        
        return queryset
