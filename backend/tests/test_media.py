import io

from PIL import Image

from app.core.admin_auth import hasher
from app.core.config import get_settings
from app.models import AdminAccount
from app.services.images import MAX_BYTES


def png(color: str = "blue") -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (120, 120), color).save(output, format="PNG")
    return output.getvalue()


def login(client, db, tmp_path):
    client.app.dependency_overrides[get_settings]().media_storage_dir = str(tmp_path)
    db.add(
        AdminAccount(
            email="media@example.com", password_hash=hasher.hash("media-test-password-123")
        )
    )
    db.commit()
    response = client.post(
        "/api/v1/admin/login",
        json={"email": "media@example.com", "password": "media-test-password-123"},
    )
    assert response.status_code == 200
    return {"X-CSRF-Token": response.json()["csrf_token"]}


def test_upload_requires_session_and_valid_file(client, db, tmp_path):
    assert client.get("/api/v1/admin/media").status_code == 401
    assert (
        client.post(
            "/api/v1/admin/media",
            data={"alt": "Test image"},
            files={"file": ("a.png", png(), "image/png")},
        ).status_code
        == 401
    )
    assert client.get("/api/v1/media/assignments").json() == []

    headers = login(client, db, tmp_path)
    invalid = client.post(
        "/api/v1/admin/media",
        headers=headers,
        data={"alt": "Invalid image"},
        files={"file": ("bad.png", b"not an image", "image/png")},
    )
    assert invalid.status_code == 400
    too_large = client.post(
        "/api/v1/admin/media",
        headers=headers,
        data={"alt": "Large image"},
        files={"file": ("large.png", b"x" * (MAX_BYTES + 1), "image/png")},
    )
    assert too_large.status_code == 413

    uploaded = client.post(
        "/api/v1/admin/media",
        headers=headers,
        data={"alt": "Blue image"},
        files={"file": ("valid.png", png(), "application/octet-stream")},
    )
    assert uploaded.status_code == 201
    item = uploaded.json()
    assert item["content_type"] == "image/png"
    assert item["width"] == item["height"] == 120
    assert client.get("/api/v1/admin/media?search=Blue").json()["total"] == 1
    assert client.get(f"/api/v1/admin/media/{item['id']}").json()["usage"] == []
    filename = item["url"].rsplit("/", 1)[1]
    assert client.get(f"/api/v1/media/files/{filename}").status_code == 404
    assert client.get(f"/api/v1/admin/media/{item['id']}/file").status_code == 200


def test_assignment_visibility_replace_and_in_use_delete(client, db, tmp_path):
    headers = login(client, db, tmp_path)
    item = client.post(
        "/api/v1/admin/media",
        headers=headers,
        data={"alt": "Profile portrait"},
        files={"file": ("photo.png", png(), "image/png")},
    ).json()
    assert (
        client.put(
            "/api/v1/admin/media/assignments/hero_avatar",
            headers=headers,
            json={"asset_id": item["id"]},
        ).status_code
        == 200
    )
    assert client.get("/api/v1/media/assignments").json()[0]["slot"] == "hero_avatar"
    assert client.delete(f"/api/v1/admin/media/{item['id']}", headers=headers).status_code == 409
    old_file = item["url"].rsplit("/", 1)[1]
    replaced = client.put(
        f"/api/v1/admin/media/{item['id']}/file",
        headers=headers,
        files={"file": ("new.png", png("red"), "image/png")},
    )
    assert replaced.status_code == 200
    assert replaced.json()["url"] != item["url"]
    assert client.get(f"/api/v1/media/files/{old_file}").status_code == 200
    new_file = replaced.json()["url"].rsplit("/", 1)[1]
    assert client.get(f"/api/v1/media/files/{new_file}").status_code == 200
    assert (
        client.delete("/api/v1/admin/media/assignments/hero_avatar", headers=headers).status_code
        == 204
    )
    assert client.delete(f"/api/v1/admin/media/{item['id']}", headers=headers).status_code == 204
    assert not list(tmp_path.glob("*.png"))


def test_project_media_reaches_public_api_in_saved_order(client, db, tmp_path):
    headers = login(client, db, tmp_path)
    assets = []
    for color in ("blue", "red"):
        response = client.post(
            "/api/v1/admin/media",
            headers=headers,
            data={"alt": f"{color} project image"},
            files={"file": (f"{color}.png", png(color), "image/png")},
        )
        assert response.status_code == 201
        assets.append(response.json())
    project = client.post(
        "/api/v1/admin/projects",
        headers=headers,
        json={
            "slug": "media-case-study",
            "title": "Media case study",
            "summary": "Test summary",
            "description": "Test description",
            "status": "draft",
            "technology_ids": [],
        },
    ).json()
    project_id = project["id"]
    assert (
        client.put(
            "/api/v1/admin/media/assignments/project_thumbnail",
            headers=headers,
            json={"asset_id": assets[0]["id"], "project_id": project_id},
        ).status_code
        == 200
    )
    assert (
        client.put(
            f"/api/v1/admin/media/projects/{project_id}/gallery",
            headers=headers,
            json={"asset_ids": [assets[1]["id"], assets[0]["id"]]},
        ).status_code
        == 200
    )
    assert client.get("/api/v1/media/assignments").json() == []
    assert (
        client.post(f"/api/v1/admin/projects/{project_id}/publish", headers=headers).status_code
        == 200
    )
    public = client.get("/api/v1/projects/media-case-study")
    assert public.status_code == 200
    assert public.json()["thumbnail"]["alt"] == "blue project image"
    assert [image["alt"] for image in public.json()["images"]] == [
        "red project image",
        "blue project image",
    ]
    assert client.get("/api/v1/media/assignments").json()[0]["project_slug"] == "media-case-study"
