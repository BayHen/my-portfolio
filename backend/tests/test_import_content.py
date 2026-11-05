from sqlalchemy import select

from app.models.entities import Profile, Project, Technology
from app.services.import_content import ContentInput, import_content


def test_import_is_repeatable_and_skips_placeholders(db):
    content = ContentInput.model_validate(
        {
            "technologies": [{"name": "Python", "category": "language", "group": "Backend"}],
            "projects": [
                {
                    "slug": "verified-project",
                    "title": "Verified project",
                    "summary": "Confirmed summary",
                    "description": "Confirmed description",
                    "technologies": ["Python"],
                    "publish": True,
                },
                {
                    "slug": "example-project",
                    "title": "Example project",
                    "summary": "Sample summary",
                    "description": "Sample description",
                    "placeholder": True,
                },
            ],
            "profile": {
                "name": "TODO",
                "headline": "Example",
                "bio": "Example",
                "placeholder": True,
            },
        }
    )
    import_content(db, content)
    import_content(db, content)
    assert len(db.scalars(select(Technology)).all()) == 1
    projects = db.scalars(select(Project)).all()
    assert len(projects) == 1
    assert projects[0].slug == "verified-project"
    assert projects[0].published_at is not None
    assert db.get(Profile, 1) is None


def test_import_rolls_back_on_missing_relationship(db):
    content = ContentInput.model_validate(
        {
            "technologies": [{"name": "Python", "category": "language"}],
            "projects": [
                {
                    "slug": "broken-project",
                    "title": "Broken",
                    "summary": "Summary",
                    "description": "Description",
                    "technologies": ["Unknown"],
                }
            ],
        }
    )
    try:
        import_content(db, content)
    except ValueError:
        db.rollback()
    else:
        raise AssertionError("Missing technology should reject the import")
    assert db.scalars(select(Technology)).all() == []
