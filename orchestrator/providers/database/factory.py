from ...config import settings
from ...infrastructure.tidb_persistence import TiDBVectorPersistence
from .supabase_provider import SupabaseDatabaseProvider


def get_database_provider():
    # LAZY-CEO: Default to Supabase, but respect the Sovereign Flag
    if settings.database_provider == "tidb":
        return TiDBVectorPersistence(
            host=settings.tidb_host,
            port=settings.tidb_port,
            user=settings.tidb_user,
            password=settings.tidb_password,
        )
    return SupabaseDatabaseProvider(
        url=settings.supabase_url, key=settings.supabase_service_role_key
    )
