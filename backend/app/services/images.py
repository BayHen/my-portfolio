"""Validate raster uploads and store them in configured S3-compatible storage."""

import io
import secrets
from urllib.parse import urljoin

import boto3
from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import Settings
from app.core.errors import AppError

MAX_BYTES = 5 * 1024 * 1024
FORMATS = {
    "JPEG": ("image/jpeg", ".jpg"),
    "PNG": ("image/png", ".png"),
    "WEBP": ("image/webp", ".webp"),
}


def storage_client(settings: Settings):
    return boto3.client("s3", region_name=settings.s3_region, endpoint_url=settings.s3_endpoint_url)


async def upload_image(file: UploadFile, settings: Settings) -> tuple[str, str]:
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise AppError("image_too_large", 413, "Image exceeds 5 MB.")
    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
        with Image.open(io.BytesIO(data)) as image:
            if image.format not in FORMATS or image.width < 100 or image.height < 100:
                raise AppError("invalid_image", 400, "Unsupported image or dimensions.")
            if image.width > 6000 or image.height > 6000:
                raise AppError("invalid_image", 400, "Image dimensions are too large.")
            content_type, suffix = FORMATS[image.format]
    except (UnidentifiedImageError, OSError, ValueError):
        raise AppError("invalid_image", 400, "Invalid image file.") from None
    if not settings.s3_bucket or not settings.s3_public_base_url:
        raise AppError("storage_unavailable", 503, "Image storage is not configured.")
    key = f"devfolio/projects/{secrets.token_hex(20)}{suffix}"
    storage_client(settings).put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )
    return urljoin(settings.s3_public_base_url.rstrip("/") + "/", key), key


def delete_image_object(key: str, settings: Settings) -> None:
    if settings.s3_bucket and key.startswith("devfolio/projects/"):
        storage_client(settings).delete_object(Bucket=settings.s3_bucket, Key=key)


def key_from_url(url: str, settings: Settings) -> str | None:
    base = (settings.s3_public_base_url or "").rstrip("/") + "/"
    if url.startswith(base):
        key = url[len(base) :]
        if key.startswith("devfolio/projects/") and "/" not in key[len("devfolio/projects/") :]:
            return key
    return None
