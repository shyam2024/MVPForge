# MVPForge Backend – Pytest Unit Tests

## Folder Structure

Place the `tests/` folder **inside** your `backend/` directory, at the same level as `main.py`:

```
backend/
├── app/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   └── utils/
├── config/
├── main.py
├── requirements.txt
└── tests/                  ← place this folder here
    ├── pytest.ini
    ├── conftest.py
    ├── test_security.py
    ├── test_auth_middleware.py
    ├── test_auth_routes.py
    ├── test_projects_routes.py
    ├── test_users_routes.py
    ├── test_stage1_service.py
    ├── test_stage1_route.py
    ├── test_ai_service.py
    └── test_schemas.py
```

---

## What Is Tested

| File | Covers |
|------|--------|
| `test_security.py` | `app/utils/security.py` – password hashing, JWT encode/decode |
| `test_auth_middleware.py` | `app/middleware/auth.py` – hash, verify, token creation, `get_current_user` |
| `test_auth_routes.py` | `app/routes/auth.py` – register, login, get_me, update_me |
| `test_projects_routes.py` | `app/routes/projects.py` – list, create, get, update, delete |
| `test_users_routes.py` | `app/routes/users.py` – profile CRUD, authorization checks |
| `test_stage1_service.py` | `app/services/stage1_service.py` – chat processing, score parsing, PVD generation |
| `test_stage1_route.py` | `app/routes/stage1.py` – chat endpoint, proceed endpoint (threshold + force) |
| `test_ai_service.py` | `app/services/ai_service.py` – message building, chat/structured/single completions |
| `test_schemas.py` | `app/schemas/user.py` + `app/schemas/project.py` – Pydantic validation |

All tests are **unit tests** – they mock database calls (Beanie/Motor) and AI calls (LangChain/Groq) so you **do not** need a running MongoDB or a real API key.

---

## Prerequisites

Make sure you have Python 3.10+ and your virtual environment activated, then install:

```bash
pip install -r requirements.txt
```

If you want to install only the test dependencies in isolation:

```bash
pip install pytest pytest-asyncio httpx
```

---

## Running the Tests

From inside the `backend/` directory:

```bash
# Run all tests
pytest tests/

# Run with verbose output
pytest tests/ -v

# Run a single test file
pytest tests/test_auth_routes.py -v

# Run a single test class
pytest tests/test_projects_routes.py::TestCreateProject -v

# Run a single test function
pytest tests/test_stage1_service.py::TestProcessChat::test_scores_parsed_from_response -v

# Show print/log output while running
pytest tests/ -v -s

# Generate a short summary of failures only
pytest tests/ --tb=short
```

---

## Configuration

`tests/pytest.ini` is pre-configured with:

```ini
[pytest]
asyncio_mode = auto       # auto-handles async test functions
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

No extra `@pytest.mark.asyncio` decorators are needed on individual tests because `asyncio_mode = auto` handles them automatically.

---

## Environment Variables

Tests do **not** require a `.env` file or real credentials. All external services are mocked. If pytest complains that `GROQ_API_KEY` is missing when importing `config/settings.py`, add a temporary override:

```bash
GROQ_API_KEY=test pytest tests/ -v
```

Or create a `tests/.env.test` and load it in `conftest.py` if needed.

---

## Adding More Tests

To test additional stage services (stage2–stage7):

1. Create `tests/test_stage2_service.py` (or the relevant stage).
2. Follow the same pattern as `test_stage1_service.py`:
   - Import the service function.
   - Mock `chat_completion` / `structured_completion` with `AsyncMock`.
   - Assert the returned stage dict has the expected structure.

To test additional stage routes:

1. Create `tests/test_stage2_route.py`.
2. Mock `Project.get`, the service call, and `project.save`.
3. Assert status codes and that `project.save` was awaited.
