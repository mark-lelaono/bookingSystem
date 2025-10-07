"""
Django signals for booking notifications (WebSocket disabled for now)
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Booking


@receiver(post_save, sender=Booking)
def booking_saved(sender, instance, created, **kwargs):
    """Handle booking save - WebSocket disabled for now"""
    # WebSocket functionality temporarily disabled due to Redis dependency
    # TODO: Re-enable when Redis is properly configured
    if created:
        print(f"New booking created: {instance.purpose} in {instance.room.name}")
    else:
        print(f"Booking updated: {instance.purpose} in {instance.room.name}")


@receiver(post_delete, sender=Booking)
def booking_deleted(sender, instance, **kwargs):
    """Handle booking deletion"""
    print(f"Booking cancelled: {instance.purpose} in {instance.room.name}")