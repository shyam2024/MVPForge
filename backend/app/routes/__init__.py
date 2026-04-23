from app.routes.users import router as users_router
from app.routes.projects import router as projects_router
from app.routes.stage1 import router as stage_1_router
from app.routes.auth import router as auth_router

__all__ = ["auth_router", "users_router", "projects_router", "stage_1_router"]
