from app.services.ai_service import structured_completion
from app.models.project import Project
from typing import Dict, Any, List
import json
import asyncio
import uuid

RATE_LIMIT_DELAY = 5
CHUNK_SIZE = 5


def chunk_list(data: List, size: int):
    for i in range(0, len(data), size):
        yield data[i:i + size]
        
def normalize_task_ids(tasks: List[Dict]) -> List[Dict]:
    """
    Replace all task IDs with globally unique IDs
    and fix dependencies accordingly.
    """

    id_map = {}


    for task in tasks:
        old_id = task.get("id")
        new_id = f"task-{uuid.uuid4().hex[:8]}"
        id_map[old_id] = new_id
        task["id"] = new_id

    return tasks



async def generate_master_plan(project: Project) -> Dict[str, Any]:
    pvd = project.stage1["product_vision_document"]
    manifesto = project.stage2["selected_features_manifesto"]
    backlog = project.stage3
    arch = project.stage4

    user_stories = backlog.get("user_stories", [])

    meta = await structured_completion(
        """Return JSON:
{
  "project_name": "...",
  "tech_stack": {}
}
STRICT JSON RULES:
- Every key MUST use ":" (never "." or "=")
- JSON must be valid and parsable by Python json.loads
- Do not include syntax errors
- Do not truncate output
""",
        f"PVD Summary:\n{json.dumps(pvd)}\nArchitecture Tech Stack:\n{json.dumps(arch.get('tech_stack', {}))}",
        temperature=0.2,
    )

    await asyncio.sleep(RATE_LIMIT_DELAY)

    directory = await structured_completion(
        """You are a Senior Engineer.
Generate project directory structure.

Return JSON:
{
  "directory_structure": {
    "type": "dir",
    "name": "project-root",
    "children": [
      {
        "type": "dir|file",
        "name": "...",
        "purpose": "...",
        "children": []
      }
    ]
  }
}
STRICT JSON RULES:
- Every key MUST use ":" (never "." or "=")
- JSON must be valid and parsable by Python json.loads
- Do not include syntax errors
- Do not truncate output
""",
        f"""
Tech Stack: {json.dumps(meta.get('tech_stack', {}))}
Features: {json.dumps([f['epic_name'] for f in manifesto])}
""",
        temperature=0.2,
    )

    await asyncio.sleep(RATE_LIMIT_DELAY)

    all_tasks = []

    for chunk in chunk_list(user_stories, CHUNK_SIZE):
        tasks_chunk = await structured_completion(
            """Generate implementation tasks.

Return JSON:
{
  "tasks": [
    {
      "id": "task-uuid",
      "story_id": "...",
      "title": "...",
      "description": "...",
      "file_path": "src/...",
      "component_type": "page|component|api|service|model|config|test|util",
      "api_mapping": [],
      "db_mapping": [],
      "dependencies": [],
      "priority": "high|medium|low",
      "estimated_hours": 1
    }
  ]
}
STRICT JSON RULES:
- Every key MUST use ":" (never "." or "=")
- JSON must be valid and parsable by Python json.loads
- Do not include syntax errors
- Do not truncate output
""",
            f"""
Stories:
{json.dumps([{"id": s["id"], "title": s["title"]} for s in chunk])}

Tech Stack:
{json.dumps(meta.get("tech_stack", {}))}
""",
            temperature=0.3,
        )

        all_tasks.extend(tasks_chunk.get("tasks", []))
        await asyncio.sleep(RATE_LIMIT_DELAY)

    all_tasks = normalize_task_ids(all_tasks)
    build = await structured_completion(
        """Generate build order.

Return JSON:
{
  "build_order": []
}
STRICT JSON RULES:
- Every key MUST use ":" (never "." or "=")
- JSON must be valid and parsable by Python json.loads
- Do not include syntax errors
- Do not truncate output
""",
        json.dumps([{"id": t["id"], "dependencies": t.get("dependencies", [])} for t in all_tasks]),
        temperature=0.2,
    )

    await asyncio.sleep(RATE_LIMIT_DELAY)

    setup = await structured_completion(
        """Return JSON:
{
  "environment_variables": [],
  "setup_commands": [],
  "run_commands": {}
}
STRICT JSON RULES:
- Every key MUST use ":" (never "." or "=")
- JSON must be valid and parsable by Python json.loads
- Do not include syntax errors
- Do not truncate output
""",
        json.dumps(meta.get("tech_stack", {})),
        temperature=0.2,
    )
    

    manifest = {
        "project_name": meta.get("project_name", "Project"),
        "tech_stack": meta.get("tech_stack", {}),
        "directory_structure": directory.get("directory_structure", {}),
        "tasks": all_tasks,
        "build_order": build.get("build_order", []),
        "environment_variables": setup.get("environment_variables", []),
        "setup_commands": setup.get("setup_commands", []),
        "run_commands": setup.get("run_commands", {}),
        "status": "in_progress",
        "validation": {"is_valid": False, "errors": [], "warnings": []},
    }

    return manifest
    
def validate_manifest(stage: Dict) -> Dict:
    """Run validation checks on the master build manifest."""
    errors = []
    warnings = []
    tasks = stage.get("tasks", [])
    arch = {}  

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
