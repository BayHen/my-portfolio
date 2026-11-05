"""Validate image bytes and persist them outside PostgreSQL."""

import io
import os
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import Settings
from app.core.errors import AppError
from app.services.images import FORMATS, MAX_BYTES, storage_client


@dataclass(frozen=True)
class StoredImage:
    key: str
    backend: str
    url: str
    content_type: str
    byte_size: int
    width: int
    height: int


def local_directory(settings: Settings) -> Path:
    root = Path(settings.media_storage_dir)
    if not root.is_absolute():
        root = Path(__file__).resolve().parents[2] / root
    return root.resolve()


async def store_media(file: UploadFile, settings: Settings) -> StoredImage:
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise AppError("image_too_large", 413, "Image exceeds 5 MB.")
    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            if (
                image.format not in FORMATS
                or not 100 <= image.width <= 6000
                or not 100 <= image.height <= 6000
            ):
                raise AppError("invalid_image", 400, "Unsupported image or dimensions.")
            content_type, suffix = FORMATS[image.format]
            width, height = image.size
    except (UnidentifiedImageError, OSError, ValueError):
        raise AppError("invalid_image", 400, "Invalid image file.") from None

    filename = f"{uuid4()}{suffix}"
    key = f"media/{filename}"
    media_id = filename.rsplit(".", 1)[0]
    public_url = f"{settings.media_public_base_url.rstrip('/')}/api/v1/media/files/{media_id}"
    if settings.s3_bucket and settings.s3_public_base_url:
        storage_client(settings).put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=300",
        )
        backend = "s3"
        url = public_url
    elif settings.app_env != "production":
        directory = local_directory(settings)
        directory.mkdir(parents=True, exist_ok=True)
        temporary = directory / f".{uuid4()}.tmp"
        destination = directory / filename
        try:
            temporary.write_bytes(data)
            os.replace(temporary, destination)
        finally:
            temporary.unlink(missing_ok=True)
        backend = "local"
        url = public_url
    else:
        raise AppError("storage_unavailable", 503, "Media storage is not configured.")
    return StoredImage(key, backend, url, content_type, len(data), width, height)


def delete_media(key: str, backend: str, settings: Settings) -> None:
    if not key.startswith("media/") or "/" in key[len("media/") :]:
        raise ValueError("Invalid media key")
    if backend == "s3":
        if not settings.s3_bucket:
            raise AppError("storage_unavailable", 503, "Media storage is not configured.")
        storage_client(settings).delete_object(Bucket=settings.s3_bucket, Key=key)
    elif backend == "local":
        (local_directory(settings) / key.removeprefix("media/")).unlink(missing_ok=True)
    else:
        raise ValueError("Invalid media backend")
