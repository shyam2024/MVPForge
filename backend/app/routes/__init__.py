from app.routes.users import router as users_router
from app.routes.auth import router as auth_router
from app.routes.projects import router as projects_router
from app.routes.stage1 import router as stage_1_router
from app.routes.stage2 import router as stage_2_router
from app.routes.stage3 import router as stage_3_router
from app.routes.stage4 import router as stage_4_router
from app.routes.stage5 import router as stage_5_router
from app.routes.stage6 import router as stage_6_router
from app.routes.stage7 import router as stage_7_router

__all__ = ["auth_router", "users_router", "projects_router", "stage_1_router", "stage_2_router", "stage_3_router", "stage_4_router", "stage_5_router", "stage_6_router", "stage_7_router"]
