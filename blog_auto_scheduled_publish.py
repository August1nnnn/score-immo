"""Promote prewritten ScoreImmo articles only after their sealed publication time."""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path


class _AnchorParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.anchors = []
        self._current = None

    def handle_starttag(self, tag, attrs):
        if tag.lower() != "a":
            return
        values = dict(attrs)
        self._current = {
            "href": values.get("href", ""),
            "rel": set(values.get("rel", "").split()),
            "text": [],
        }

    def handle_data(self, data):
        if self._current is not None:
            self._current["text"].append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._current is not None:
            self._current["text"] = "".join(self._current["text"]).strip()
            self.anchors.append(self._current)
            self._current = None


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _safe_repo_path(repo_root: Path, relative_path: str) -> Path:
    if not relative_path or Path(relative_path).is_absolute():
        raise ValueError(f"unsafe scheduled path: {relative_path!r}")
    resolved = (repo_root / relative_path).resolve()
    try:
        resolved.relative_to(repo_root)
    except ValueError as exc:
        raise ValueError(f"scheduled path escapes repository: {relative_path}") from exc
    return resolved


def _parse_publish_at(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("publish_at must include an explicit timezone")
    return parsed


def _validate_required_link(article_path: Path, requirement: dict) -> None:
    article = json.loads(article_path.read_text(encoding="utf-8"))
    parser = _AnchorParser()
    parser.feed(article.get("body_html", ""))
    required_rel = requirement.get("rel")
    for anchor in parser.anchors:
        if (
            anchor["text"] == requirement.get("anchor")
            and anchor["href"] == requirement.get("url")
            and (not required_rel or required_rel in anchor["rel"])
        ):
            return
    raise ValueError("required sponsored link is missing or altered")


def _validate_artifact(repo_root: Path, artifact: dict, label: str):
    source = _safe_repo_path(repo_root, artifact.get("source", ""))
    target = _safe_repo_path(repo_root, artifact.get("target", ""))
    if not source.is_file():
        raise ValueError(f"scheduled {label} source is missing: {artifact.get('source')}")
    if target.exists():
        raise ValueError(f"scheduled {label} target already exists: {artifact.get('target')}")
    expected = artifact.get("sha256", "")
    if len(expected) != 64 or _sha256(source) != expected:
        raise ValueError(f"scheduled {label} checksum mismatch")
    return source, target


def publish_due_prepared_article(
    repo_root: Path | str,
    *,
    now: datetime | None = None,
    dry_run: bool = False,
):
    """Publish the first due sealed manifest, or return None when nothing is due."""

    root = Path(repo_root).resolve()
    manifest_dir = root / "blog-auto" / "scheduled"
    if not manifest_dir.is_dir():
        return None
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        raise ValueError("now must be timezone-aware")

    for manifest_path in sorted(manifest_dir.glob("*.manifest.json")):
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("status") != "pending":
            continue
        if _parse_publish_at(manifest.get("publish_at", "")) > current:
            continue

        article_source, article_target = _validate_artifact(root, manifest.get("article", {}), "article")
        asset_source, asset_target = _validate_artifact(root, manifest.get("asset", {}), "asset")
        _validate_required_link(article_source, manifest.get("required_link", {}))

        result = {
            "id": manifest.get("id"),
            "manifest": str(manifest_path.relative_to(root)),
            "article_target": str(article_target.relative_to(root)),
            "asset_target": str(asset_target.relative_to(root)),
        }
        if dry_run:
            return result

        article_target.parent.mkdir(parents=True, exist_ok=True)
        asset_target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(article_source, article_target)
        shutil.copy2(asset_source, asset_target)
        article_source.unlink()
        asset_source.unlink()

        manifest["status"] = "published"
        manifest["published_at"] = current.astimezone(timezone.utc).isoformat()
        manifest_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        return result

    return None
