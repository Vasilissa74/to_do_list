from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app import schemas
from backend.app.database import Base, engine, get_db
from sqlalchemy.orm import Session
import pytest
from backend.app import auth
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool


# Используем SQLite in-memory database для тестов
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool
)


@pytest.fixture()
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(test_db):
    def override_get_db():
        db = Session(engine)
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides = {}


def test_create_user(client):
    response = client.post(
        "/auth/register",
        json={"username": "testuser", "password": "testpassword"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_login_user(client):
    response = client.post(
        "/auth/token",
        data={"username": "testuser", "password": "testpassword"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_create_project(client):
    # Сначала нужно зарегистрировать и залогиниться
    client.post(
        "/auth/register",
        json={"username": "testuser2", "password": "testpassword2"},
    )
    token_response = client.post(
        "/auth/token",
        data={"username": "testuser2", "password": "testpassword2"},
    )
    access_token = token_response.json()["access_token"]

    response = client.post(
        "/projects/",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"name": "Test Project", "description": "Test Description"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Project"


def test_read_projects(client):
    # Сначала нужно зарегистрировать и залогиниться
    client.post(
        "/auth/register",
        json={"username": "testuser3", "password": "testpassword3"},
    )
    token_response = client.post(
        "/auth/token",
        data={"username": "testuser3", "password": "testpassword3"},
    )
    access_token = token_response.json()["access_token"]

    # Создаем проект
    client.post(
        "/projects/",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"name": "Test Project", "description": "Test Description"},
    )

    response = client.get(
        "/projects/",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) > 0


def test_create_task(client):
    # Сначала нужно зарегистрировать и залогиниться
    client.post(
        "/auth/register",
        json={"username": "testuser4", "password": "testpassword4"},
    )
    token_response = client.post(
        "/auth/token",
        data={"username": "testuser4", "password": "testpassword4"},
    )
    access_token = token_response.json()["access_token"]

    # Создаем проект
    project_response = client.post(
        "/projects/",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"name": "Test Project", "description": "Test Description"},
    )
    project_id = project_response.json()["id"]

    response = client.post(
        f"/projects/{project_id}/tasks/",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"title": "Test Task", "description": "Test Description", "priority": "high"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Test Task"
    assert response.json()["priority"] == "high"
