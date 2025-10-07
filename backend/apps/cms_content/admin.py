"""
Wagtail admin configuration for CMS content
"""
from django.contrib import admin
from .models import SiteConfiguration, QuickLink

# Register snippets with standard Django admin since Wagtail modeladmin is deprecated
# Snippets are already registered in models.py with @register_snippet