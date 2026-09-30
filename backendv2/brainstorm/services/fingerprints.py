import unicodedata


def fingerprint_title(title: str) -> str:
    """Normalize obvious same-title duplicates without guessing semantic similarity."""
    normalized = unicodedata.normalize("NFKC", title).casefold()
    words = []
    for character in normalized:
        category = unicodedata.category(character)
        words.append(" " if category.startswith("P") else character)
    return " ".join("".join(words).split())
