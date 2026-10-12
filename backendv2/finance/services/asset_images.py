"""Small, metadata-free asset photos persisted in the database, not local disk."""
import base64
import binascii
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework.exceptions import ValidationError


MAX_IMAGE_BYTES = 256 * 1024


def normalize_asset_image(value):
    if value is None:
        return None
    try:
        header, encoded = value.split(",", 1)
        if header not in {"data:image/jpeg;base64", "data:image/png;base64", "data:image/webp;base64"}:
            raise ValueError
        raw = base64.b64decode(encoded, validate=True)
        if not raw or len(raw) > MAX_IMAGE_BYTES:
            raise ValueError
        with Image.open(BytesIO(raw)) as source:
            if source.format not in {"JPEG", "PNG", "WEBP"} or source.width * source.height > 12_000_000 or getattr(source, "is_animated", False):
                raise ValueError
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((960, 960), Image.Resampling.LANCZOS)
            # Copy pixels into a fresh image so EXIF and other source metadata cannot leak.
            clean = Image.new("RGB", image.size)
            clean.paste(image)
            for quality in (80, 65, 45):
                output = BytesIO()
                clean.save(output, format="WEBP", quality=quality, method=4)
                data = output.getvalue()
                if len(data) <= MAX_IMAGE_BYTES:
                    return data
    except (ValueError, TypeError, binascii.Error, OSError, UnidentifiedImageError, Image.DecompressionBombError):
        pass
    raise ValidationError("Choose a valid still JPG, PNG or WebP image. The optimized upload must be 256 KB or smaller.")
