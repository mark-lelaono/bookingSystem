"""
Wagtail CMS models for ICPAC Booking System
Handles content management, pages, and dynamic content
"""
from django.db import models
from wagtail.models import Page, Orderable
from wagtail.fields import RichTextField, StreamField
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.search import index
from wagtail.snippets.models import register_snippet
from modelcluster.fields import ParentalKey
from modelcluster.models import ClusterableModel


class HomePage(Page):
    """
    Home page model with hero section and key information
    """
    hero_title = models.CharField(
        max_length=255,
        default="ICPAC Internal Booking System",
        help_text="Main hero title"
    )
    
    hero_subtitle = models.TextField(
        default="Streamline your conference room reservations, manage meeting schedules, and enhance team collaboration",
        help_text="Hero subtitle/description"
    )
    
    hero_image = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        help_text="Hero background image"
    )
    
    welcome_section_title = models.CharField(
        max_length=255,
        default="Welcome to ICPAC Booking System",
        help_text="Welcome section title"
    )
    
    welcome_content = RichTextField(
        default="<p>Please login to your account or create a new one to access the meeting room booking system.</p>",
        help_text="Welcome section content"
    )
    
    # Statistics section
    show_statistics = models.BooleanField(
        default=True,
        help_text="Show room statistics on homepage"
    )
    
    statistics_title = models.CharField(
        max_length=255,
        default="Room Analytics & Insights",
        help_text="Statistics section title"
    )
    
    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('hero_title'),
            FieldPanel('hero_subtitle'),
            FieldPanel('hero_image'),
        ], heading="Hero Section"),
        
        MultiFieldPanel([
            FieldPanel('welcome_section_title'),
            FieldPanel('welcome_content'),
        ], heading="Welcome Section"),
        
        MultiFieldPanel([
            FieldPanel('show_statistics'),
            FieldPanel('statistics_title'),
        ], heading="Statistics Section"),
    ]
    
    search_fields = Page.search_fields + [
        index.SearchField('hero_title'),
        index.SearchField('hero_subtitle'),
        index.SearchField('welcome_content'),
    ]
    
    class Meta:
        verbose_name = "Home Page"


class AnnouncementPage(Page):
    """
    Page for system announcements and news
    """
    date = models.DateField("Announcement date")
    intro = models.CharField(max_length=250, help_text="Brief introduction")
    body = RichTextField(blank=True, help_text="Full announcement content")
    
    is_urgent = models.BooleanField(
        default=False,
        help_text="Mark as urgent announcement"
    )
    
    show_on_homepage = models.BooleanField(
        default=True,
        help_text="Show this announcement on the homepage"
    )
    
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this announcement should stop being shown"
    )
    
    content_panels = Page.content_panels + [
        FieldPanel('date'),
        FieldPanel('intro'),
        FieldPanel('body'),
        MultiFieldPanel([
            FieldPanel('is_urgent'),
            FieldPanel('show_on_homepage'),
            FieldPanel('expires_at'),
        ], heading="Display Settings"),
    ]
    
    search_fields = Page.search_fields + [
        index.SearchField('intro'),
        index.SearchField('body'),
    ]
    
    class Meta:
        verbose_name = "Announcement"
        ordering = ['-date']


class PolicyPage(Page):
    """
    Page for policies, guidelines, and procedures
    """
    POLICY_TYPES = [
        ('booking', 'Booking Policy'),
        ('usage', 'Room Usage Guidelines'),
        ('security', 'Security Policy'),
        ('general', 'General Guidelines'),
        ('terms', 'Terms of Service'),
        ('privacy', 'Privacy Policy'),
    ]
    
    policy_type = models.CharField(
        max_length=20,
        choices=POLICY_TYPES,
        default='general',
        help_text="Type of policy"
    )
    
    version = models.CharField(
        max_length=10,
        default="1.0",
        help_text="Policy version"
    )
    
    effective_date = models.DateField(
        help_text="When this policy becomes effective"
    )
    
    content = RichTextField(help_text="Policy content")
    
    content_panels = Page.content_panels + [
        FieldPanel('policy_type'),
        FieldPanel('version'),
        FieldPanel('effective_date'),
        FieldPanel('content'),
    ]
    
    search_fields = Page.search_fields + [
        index.SearchField('content'),
    ]
    
    class Meta:
        verbose_name = "Policy Page"


class HelpPage(Page):
    """
    Help and documentation pages
    """
    HELP_CATEGORIES = [
        ('getting_started', 'Getting Started'),
        ('booking', 'Booking Rooms'),
        ('account', 'Account Management'),
        ('troubleshooting', 'Troubleshooting'),
        ('faq', 'Frequently Asked Questions'),
        ('contact', 'Contact Support'),
    ]
    
    category = models.CharField(
        max_length=20,
        choices=HELP_CATEGORIES,
        default='getting_started',
        help_text="Help category"
    )
    
    content = RichTextField(help_text="Help content")
    
    video_url = models.URLField(
        blank=True,
        help_text="Optional tutorial video URL"
    )
    
    order = models.IntegerField(
        default=0,
        help_text="Order in category (lower numbers appear first)"
    )
    
    content_panels = Page.content_panels + [
        FieldPanel('category'),
        FieldPanel('content'),
        FieldPanel('video_url'),
        FieldPanel('order'),
    ]
    
    search_fields = Page.search_fields + [
        index.SearchField('content'),
    ]
    
    class Meta:
        verbose_name = "Help Page"
        ordering = ['category', 'order', 'title']


@register_snippet
class SiteConfiguration(ClusterableModel):
    """
    Global site configuration settings
    """
    site_title = models.CharField(
        max_length=255,
        default="ICPAC Booking System"
    )
    
    site_description = models.TextField(
        default="Professional meeting room booking system for ICPAC staff"
    )
    
    contact_email = models.EmailField(
        default="support@icpac.net",
        help_text="Contact email for support"
    )
    
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number"
    )
    
    office_hours = models.CharField(
        max_length=255,
        default="Monday - Friday, 8:00 AM - 5:00 PM EAT",
        help_text="Office hours information"
    )
    
    # Social media and external links
    website_url = models.URLField(
        blank=True,
        help_text="Main ICPAC website URL"
    )
    
    # System settings
    allow_self_registration = models.BooleanField(
        default=True,
        help_text="Allow users to register themselves"
    )
    
    require_email_verification = models.BooleanField(
        default=True,
        help_text="Require email verification for new accounts"
    )
    
    max_advance_booking_days = models.IntegerField(
        default=30,
        help_text="Maximum days in advance users can book rooms"
    )
    
    default_booking_duration = models.IntegerField(
        default=2,
        help_text="Default booking duration in hours"
    )
    
    # Notification settings
    send_booking_confirmations = models.BooleanField(
        default=True,
        help_text="Send email confirmations for bookings"
    )
    
    send_reminder_notifications = models.BooleanField(
        default=True,
        help_text="Send reminder notifications before meetings"
    )
    
    reminder_hours_before = models.IntegerField(
        default=2,
        help_text="Hours before meeting to send reminder"
    )
    
    panels = [
        MultiFieldPanel([
            FieldPanel('site_title'),
            FieldPanel('site_description'),
        ], heading="Site Information"),
        
        MultiFieldPanel([
            FieldPanel('contact_email'),
            FieldPanel('contact_phone'),
            FieldPanel('office_hours'),
            FieldPanel('website_url'),
        ], heading="Contact Information"),
        
        MultiFieldPanel([
            FieldPanel('allow_self_registration'),
            FieldPanel('require_email_verification'),
            FieldPanel('max_advance_booking_days'),
            FieldPanel('default_booking_duration'),
        ], heading="System Settings"),
        
        MultiFieldPanel([
            FieldPanel('send_booking_confirmations'),
            FieldPanel('send_reminder_notifications'),
            FieldPanel('reminder_hours_before'),
        ], heading="Notification Settings"),
    ]
    
    class Meta:
        verbose_name = "Site Configuration"
        verbose_name_plural = "Site Configuration"
    
    def __str__(self):
        return self.site_title


@register_snippet  
class QuickLink(models.Model):
    """
    Quick links for easy navigation
    """
    title = models.CharField(max_length=100)
    url = models.URLField(help_text="URL or path")
    description = models.CharField(max_length=255, blank=True)
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="CSS icon class or emoji"
    )
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    panels = [
        FieldPanel('title'),
        FieldPanel('url'),
        FieldPanel('description'),
        FieldPanel('icon'),
        FieldPanel('order'),
        FieldPanel('is_active'),
    ]
    
    class Meta:
        ordering = ['order', 'title']
        verbose_name = "Quick Link"
        verbose_name_plural = "Quick Links"
    
    def __str__(self):
        return self.title