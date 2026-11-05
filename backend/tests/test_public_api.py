from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.db.session import get_db
from app.models import ContactMessage, Experience, Profile, Project, Technology


def seed(db):
    python = Technology(name="Python", category="language", group="Backend")
    draft = Project(
        slug="draft",
        title="Draft",
        summary="Private draft",
        description="Hidden",
        status="draft",
        technologies=[python],
    )
    published = Project(
        slug="published",
        title="Published",
        summary="Public project",
        description="Visible",
        status="live",
        is_featured=True,
        published_at=datetime.now(timezone.utc),
        technologies=[python],
    )
    db.add_all(
        [
            draft,
            published,
            Experience(
                role="Developer", organization="Example", start_date="2024", summary="Private"
            ),
            Profile(id=1, name="Owner", headline="Developer", bio="Verified profile"),
        ]
    )
    db.commit()


def test_projects_only_publish_and_filter(client, db):
    seed(db)
    result = client.get("/api/v1/projects").json()
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "published"
    assert client.get("/api/v1/projects?technology=Python&featured=true").json()["total"] == 1
    assert client.get("/api/v1/projects?technology=Go").json()["total"] == 0
    assert client.get("/api/v1/projects?limit=0").status_code == 422
    assert client.get("/api/v1/projects/draft").status_code == 404
    assert client.get("/api/v1/projects/published").status_code == 200


def test_profile_experience_and_technologies_hide_drafts(client, db):
    seed(db)
    assert client.get("/api/v1/profile").status_code == 404
    assert client.get("/api/v1/experiences").json() == []
    assert len(client.get("/api/v1/technologies?category=language").json()) == 1
    assert client.get("/api/v1/technologies?category=database").json() == []


def test_contact_validation_idempotency_and_abuse(client, db):
    assert client.post("/api/v1/contact", json={}).status_code == 422
    body = {"name": "Ada", "email": "ada@example.com", "message": "Hello from test"}
    headers = {"Idempotency-Key": "test-contact-key-0001"}
    first = client.post("/api/v1/contact", json=body, headers=headers)
    assert first.status_code == 201
    assert first.json() == {"stored": True, "notification": "not_configured"}
    assert client.post("/api/v1/contact", json=body, headers=headers).status_code == 201
    assert db.query(ContactMessage).count() == 1
    changed = dict(body, message="A different message")
    assert client.post("/api/v1/contact", json=changed, headers=headers).status_code == 409
    for i in range(2, 6):
        assert (
            client.post(
                "/api/v1/contact",
                json=body,
                headers={"Idempotency-Key": f"test-contact-key-{i:04d}"},
            ).status_code
            == 201
        )
    assert (
        client.post(
            "/api/v1/contact", json=body, headers={"Idempotency-Key": "test-contact-key-0006"}
        ).status_code
        == 429
    )
    assert client.get("/api/v1/contact").status_code == 405


def test_constraints_and_transaction_rollback(db):
    db.add(Technology(name="Python", category="language"))
    db.commit()
    db.add(Technology(name="Python", category="language"))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
    assert db.query(Technology).count() == 1


def test_health_and_request_id(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "devfolio-api"}
    assert response.headers.get("x-request-id")
    assert client.get("/api/v1/health/db").json()["database"] == "connected"


def test_database_health_reports_failure_without_credentials(client):
    def unavailable_db():
        raise SQLAlchemyError("connection details must stay private")
        yield  # pragma: no cover

    client.app.dependency_overrides[get_db] = unavailable_db
    response = client.get("/api/v1/health/db")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "database_unavailable"
    assert "connection details" not in response.text
    assert client.get("/api/v1/health").status_code == 200


def test_cors_allows_configured_frontend_only(client):
    headers = {"Access-Control-Request-Method": "GET"}
    allowed = client.options(
        "/api/v1/projects", headers={**headers, "Origin": "http://localhost:3000"}
    )
    denied = client.options(
        "/api/v1/projects", headers={**headers, "Origin": "https://other.example"}
    )
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "access-control-allow-origin" not in denied.headers
