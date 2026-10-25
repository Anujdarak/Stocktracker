import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("marketpulse.db")

_client = None
_db = None
_is_mock = False


def init_db(uri: Optional[str] = None, db_name: Optional[str] = None):
    """
    Initialize MongoDB database connection.
    Connects to MongoDB Atlas if MONGODB_URI is provided.
    Falls back to mongomock if MONGODB_URI is absent or unreachable.
    """
    global _client, _db, _is_mock

    target_uri = uri or os.getenv("MONGODB_URI", "").strip()
    target_db_name = db_name or os.getenv("MONGODB_DB_NAME", "stocktracker").strip()

    if target_uri:
        try:
            import pymongo
            client = pymongo.MongoClient(
                target_uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Ping database to confirm live connection
            client.admin.command("ping")
            _client = client
            # Extract database name from URI if present, otherwise use target_db_name
            db_from_uri = client.get_default_database()
            _db = db_from_uri if db_from_uri is not None else client[target_db_name]
            _is_mock = False
            logger.info("Connected successfully to MongoDB Atlas: %s", _db.name)
        except Exception as e:
            logger.warning(
                "Could not connect to live MongoDB Atlas (%s). Falling back to mock MongoDB engine.",
                e
            )
            import mongomock
            _client = mongomock.MongoClient()
            _db = _client[target_db_name]
            _is_mock = True
    else:
        import mongomock
        _client = mongomock.MongoClient()
        _db = _client[target_db_name]
        _is_mock = True
        logger.info("MONGODB_URI not set. Using local in-memory MongoDB engine for persistent session data.")

    # Create indexes
    _setup_indexes(_db)
    return _db


def _setup_indexes(db):
    """Ensure indexes on collections for uniqueness and performance."""
    try:
        # 1. Unique index on email for users collection
        db.users.create_index("email", unique=True)
        # 2. Unique index on user_id for watchlists collection
        db.watchlists.create_index("user_id", unique=True)
        # 3. Unique index on user_id for preferences collection
        db.user_preferences.create_index("user_id", unique=True)
        # 4. Composite index on user_id and created_at for analysis_history
        db.analysis_history.create_index([("user_id", 1), ("created_at", -1)])
    except Exception as e:
        logger.warning("Error setting up MongoDB indexes: %s", e)


def get_db():
    """Retrieve active MongoDB database instance, initializing if necessary."""
    global _db
    if _db is None:
        _db = init_db()
    return _db


def get_users_collection():
    return get_db().users


def get_watchlists_collection():
    return get_db().watchlists


def get_preferences_collection():
    return get_db().user_preferences


def get_analysis_history_collection():
    return get_db().analysis_history


def is_mock_db() -> bool:
    """Return whether the current database session is using in-memory mock."""
    return _is_mock
