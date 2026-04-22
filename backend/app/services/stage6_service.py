from app.services.ai_service import structured_completion
from app.models.project import Project
from typing import Dict, Any, List
import json


async def generate_master_plan(project: Project) -> Dict[str, Any]:
    pvd = project.stage1["product_vision_document"]
    manifesto = project.stage2["selected_features_manifesto"]
    backlog = project.stage3
    arch = project.stage4

    manifest = await structured_completion(
        """You are a Principal Software Architect and Lead Engineer.
Create the COMPLETE Master Build Manifest — the engineering blueprint to implement the entire system.
Return JSON:
{
  "project_name": "...",
  "tech_stack": {...},
  "directory_structure": {
    "type": "dir",
    "name": "project-root",
    "children": [
      {
        "type": "dir|file",
        "name": "...",
        "purpose": "...",
        "children": [...]
      }
    ]
  },
  "tasks": [
    {
      "id": "task-uuid",
      "story_id": "...",
      "title": "Implement ...",
      "description": "Detailed implementation description",
      "file_path": "src/...",
      "component_type": "page|component|api|service|model|config|test|util",
      "api_mapping": ["GET /api/v1/..."],
      "db_mapping": ["Collection.field"],
      "dependencies": ["other-task-id"],
      "priority": "critical|high|medium|low",
      "estimated_hours": 0.5-8
    }
  ],
  "build_order": ["task-id-1", "task-id-2"],
  "environment_variables": [
    {"key": "VAR_NAME", "description": "...", "required": true, "example": "..."}
  ],
  "setup_commands": ["npm install", "pip install -r requirements.txt", ...],
  "run_commands": {"dev": "...", "build": "...", "test": "...", "start": "..."}
}
Be EXHAUSTIVE. Map ALL user stories to tasks. Include setup files, config, auth, tests.""",
        f"""
PVD: {json.dumps(pvd, indent=2)}
Architecture: {json.dumps({k: v for k, v in arch.items() if k != 'status'}, indent=2)}
User Stories: {json.dumps(backlog.get('user_stories', []), indent=2)}
""",
        temperature=0.2,
    )

    manifest["status"] = "in_progress"
    manifest["validation"] = {"is_valid": False, "errors": [], "warnings": []}
    return manifest


def validate_manifest(stage: Dict) -> Dict:
    """Run validation checks on the master build manifest."""
    errors = []
    warnings = []
    tasks = stage.get("tasks", [])
    arch = {}  # Would normally pull from project

    # Check for duplicate file paths
    file_paths = [t.get("file_path") for t in tasks if t.get("file_path")]
    from collections import Counter
    dupes = [p for p, c in Counter(file_paths).items() if c > 1]
    if dupes:
        warnings.append(f"Duplicate file paths detected: {dupes}")

    # Check for missing dependencies
    task_ids = {t["id"] for t in tasks}
    for task in tasks:
        for dep in task.get("dependencies", []):
            if dep not in task_ids:
                errors.append(f"Task {task['id']} has unknown dependency: {dep}")

    # Check build order completeness
    build_order = stage.get("build_order", [])
    ordered_ids = set(build_order)
    for task in tasks:
        if task["id"] not in ordered_ids:
            warnings.append(f"Task {task['id']} ({task['title']}) not in build_order")

    is_valid = len(errors) == 0
    stage["validation"] = {
        "is_valid": is_valid,
        "errors": errors,
        "warnings": warnings,
    }
    return stage


def edit_task(stage: Dict, task_id: str, updates: Dict) -> Dict:
    for task in stage["tasks"]:
        if task["id"] == task_id:
            task.update(updates)
            break
    return validate_manifest(stage)


def edit_manifest(stage: Dict, updates: Dict) -> Dict:
    stage.update(updates)
    return validate_manifest(stage)


def confirm_manifest(stage: Dict) -> Dict:
    stage = validate_manifest(stage)
    if not stage["validation"]["is_valid"]:
        raise ValueError("Cannot confirm manifest with validation errors")
    stage["status"] = "completed"
    return stage
