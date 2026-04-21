from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from beanie import init_beanie

from app.models.user import User
from app.models.project import Project
from config.settings import settings

client: AsyncIOMotorClient   = None
db:     AsyncIOMotorDatabase = None

async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db     = client[settings.DB_NAME]
        await init_beanie(
            database=db,
            document_models=[User, Project]
        )
        print(f"Connected to MongoDB: {settings.DB_NAME}")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

async def close_db():
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")