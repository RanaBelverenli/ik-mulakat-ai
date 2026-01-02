"""
Supabase Client Service
Backend'den Supabase'e erişim için client
"""

import os
import logging
from typing import Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Supabase credentials - environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service role key (admin access)

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Supabase client'ı singleton olarak döndür"""
    global _client
    
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError(
                "Supabase credentials bulunamadı. "
                "Lütfen SUPABASE_URL ve SUPABASE_SERVICE_KEY environment variables'ları ekleyin."
            )
        
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        logger.info("[Supabase] Client oluşturuldu")
    
    return _client

