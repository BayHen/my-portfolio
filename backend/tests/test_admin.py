from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.admin_auth import hasher
from app.core.config import get_settings
from app.models.entities import AdminAccount, AdminSession, AuditEvent, ContactMessage, Project


def credentials(db):
    db.add(
        AdminAccount(email="owner@example.com", password_hash=hasher.hash("long-test-password-123"))
    )
    db.commit()
    return {"email": "owner@example.com", "password": "long-test-password-123"}


def signed_in(client, db):
    response = client.post("/api/v1/admin/login", json=credentials(db))
    assert response.status_code == 200
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "samesite=strict" in response.headers["set-cookie"].lower()
    return {"X-CSRF-Token": response.json()["csrf_token"]}


def project_payload():
    return {
        "slug": "test-project",
        "title": "Test project",
        "summary": "Summary",
        "description": "Description",
        "status": "draft",
        "technology_ids": [],
    }


def test_admin_requires_session_and_csrf(client, db):
    assert client.get("/api/v1/admin/projects").status_code == 401
    assert (
        client.get(
            "/api/v1/admin/projects", headers={"Authorization": "Bearer not-a-session"}
        ).status_code
        == 401
    )
    assert client.get("/api/v1/health").status_code == 200
    assert client.get("/api/v1/projects").status_code == 200
    assert client.post("/api/v1/admin/projects", json=project_payload()).status_code == 401
    headers = signed_in(client, db)
    assert client.post("/api/v1/admin/projects", json=project_payload()).status_code == 403
    assert (
        client.post(
            "/api/v1/admin/projects", json=project_payload(), headers={"X-CSRF-Token": "wrong"}
        ).status_code
        == 403
    )
    assert (
        client.post("/api/v1/admin/projects", json=project_payload(), headers=headers).status_code
        == 201
    )
    session = db.scalar(select(AdminSession))
    session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()
    assert client.get("/api/v1/admin/projects").status_code == 401


def test_login_rate_limit_and_logout(client, db):
    credentials(db)
    for _ in range(5):
        assert (
            client.post(
                "/api/v1/admin/login", json={"email": "owner@example.com", "password": "wrong"}
            ).status_code
            == 401
        )
    assert (
        client.post(
            "/api/v1/admin/login", json={"email": "owner@example.com", "password": "wrong"}
        ).status_code
        == 429
    )
    assert db.scalar(select(AuditEvent).where(AuditEvent.action == "login_failed")) is not None


def test_draft_publication_and_delete(client, db):
    headers = signed_in(client, db)
    created = client.post("/api/v1/admin/projects", json=project_payload(), headers=headers)
    project_id = created.json()["id"]
    assert client.get("/api/v1/projects").json()["total"] == 0
    assert client.get("/api/v1/projects/test-project").status_code == 404
    assert (
        client.post(f"/api/v1/admin/projects/{project_id}/publish", headers=headers).status_code
        == 200
    )
    assert client.get("/api/v1/projects").json()["total"] == 1
    assert (
        client.post(f"/api/v1/admin/projects/{project_id}/unpublish", headers=headers).status_code
        == 200
    )
    assert client.get("/api/v1/projects").json()["total"] == 0
    assert client.delete(f"/api/v1/admin/projects/{project_id}", headers=headers).status_code == 204
    assert db.scalar(select(Project)) is None


def test_messages_are_private_and_images_validated(client, db):
    headers = signed_in(client, db)
    db.add(
        ContactMessage(
            idempotency_key="message-test-key",
            name="Sender",
            email="sender@example.com",
            message="A private message",
            ip_hash="x" * 64,
            notification_status="not_configured",
        )
    )
    db.commit()
    assert client.get("/api/v1/admin/messages").status_code == 200
    assert client.get("/api/v1/admin/messages").json()[0]["message"] == "A private message"
    client.cookies.clear()
    assert client.get("/api/v1/admin/messages").status_code == 401
    headers = client.post(
        "/api/v1/admin/login",
        json={"email": "owner@example.com", "password": "long-test-password-123"},
    ).json()
    csrf = {"X-CSRF-Token": headers["csrf_token"]}
    project_id = client.post("/api/v1/admin/projects", json=project_payload(), headers=csrf).json()[
        "id"
    ]
    result = client.post(
        f"/api/v1/admin/projects/{project_id}/images",
        headers=csrf,
        data={"alt": "Test image"},
        files={"file": ("image.png", b"not-an-image", "image/png")},
    )
    assert result.status_code == 400


def test_technology_reference_blocks_delete(client, db):
    headers = signed_in(client, db)
    technology = client.post(
        "/api/v1/admin/technologies",
        json={"name": "Python", "category": "language"},
        headers=headers,
    ).json()
    payload = project_payload() | {"technology_ids": [technology["id"]]}
    assert client.post("/api/v1/admin/projects", json=payload, headers=headers).status_code == 201
    assert (
        client.delete(f"/api/v1/admin/technologies/{technology['id']}", headers=headers).status_code
        == 409
    )


def test_logout_revokes_session_and_profile_is_draft(client, db):
    headers = signed_in(client, db)
    profile = {
        "name": "Verified Name",
        "headline": "Developer",
        "bio": "Confirmed biography",
        "social_links": [{"label": "Site", "url": "https://example.com"}],
    }
    assert client.put("/api/v1/admin/profile", json=profile, headers=headers).status_code == 200
    assert client.get("/api/v1/profile").status_code == 404
    assert client.post("/api/v1/admin/profile/publish", headers=headers).status_code == 200
    assert client.get("/api/v1/profile").status_code == 200
    assert client.post("/api/v1/admin/logout", headers=headers).status_code == 200
    assert client.get("/api/v1/admin/profile").status_code == 401


def test_admin_proxy_token_blocks_direct_requests(client):
    settings = client.app.dependency_overrides[get_settings]()
    settings.admin_proxy_token = "isolated-proxy-token-long-enough"
    assert client.get("/api/v1/admin/session").status_code == 403
    assert (
        client.get(
            "/api/v1/admin/session", headers={"X-Admin-Proxy-Token": settings.admin_proxy_token}
        ).status_code
        == 401
    )
