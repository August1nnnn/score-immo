import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from blog_auto_scheduled_publish import publish_due_prepared_article


class ScheduledPublishTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp_dir.name)
        self.source_article = self.repo / "blog-auto/scheduled-content/article.json"
        self.source_asset = self.repo / "blog-auto/scheduled-assets/hero.webp"
        self.target_article = self.repo / "src/content/articles/guides/article.json"
        self.target_asset = self.repo / "public/images/articles/hero.webp"
        self.manifest_path = self.repo / "blog-auto/scheduled/article.manifest.json"

        self.source_article.parent.mkdir(parents=True)
        self.source_asset.parent.mkdir(parents=True)
        self.manifest_path.parent.mkdir(parents=True)
        article = {
            "body_html": (
                '<p>Vous pouvez <a href="https://www.montclair.fr/estimation-immeuble-de-rapport-en-ligne/" '
                'rel="sponsored noopener">le faire estimé par Montclair</a>.</p>'
            )
        }
        self.source_article.write_text(json.dumps(article), encoding="utf-8")
        self.source_asset.write_bytes(b"webp-fixture")
        self.manifest = {
            "id": "article",
            "status": "pending",
            "publish_at": "2026-09-25T08:00:00+02:00",
            "article": {
                "source": "blog-auto/scheduled-content/article.json",
                "target": "src/content/articles/guides/article.json",
                "sha256": self._sha256(self.source_article),
            },
            "asset": {
                "source": "blog-auto/scheduled-assets/hero.webp",
                "target": "public/images/articles/hero.webp",
                "sha256": self._sha256(self.source_asset),
            },
            "required_link": {
                "anchor": "le faire estimé par Montclair",
                "url": "https://www.montclair.fr/estimation-immeuble-de-rapport-en-ligne/",
                "rel": "sponsored",
            },
        }
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")

    def tearDown(self):
        self.temp_dir.cleanup()

    @staticmethod
    def _sha256(path):
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def test_not_due_does_not_mutate_files(self):
        result = publish_due_prepared_article(
            self.repo,
            now=datetime(2026, 9, 25, 5, 59, tzinfo=timezone.utc),
        )
        self.assertIsNone(result)
        self.assertTrue(self.source_article.exists())
        self.assertFalse(self.target_article.exists())

    def test_due_article_and_asset_are_promoted_once(self):
        result = publish_due_prepared_article(
            self.repo,
            now=datetime(2026, 9, 25, 6, 17, tzinfo=timezone.utc),
        )
        self.assertEqual(result["id"], "article")
        self.assertTrue(self.target_article.exists())
        self.assertTrue(self.target_asset.exists())
        self.assertFalse(self.source_article.exists())
        self.assertFalse(self.source_asset.exists())
        completed = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(completed["status"], "published")

        second = publish_due_prepared_article(
            self.repo,
            now=datetime(2026, 9, 25, 6, 18, tzinfo=timezone.utc),
        )
        self.assertIsNone(second)

    def test_checksum_mismatch_fails_before_any_target_is_created(self):
        self.source_asset.write_bytes(b"tampered")
        with self.assertRaisesRegex(ValueError, "checksum"):
            publish_due_prepared_article(
                self.repo,
                now=datetime(2026, 9, 25, 6, 17, tzinfo=timezone.utc),
            )
        self.assertFalse(self.target_article.exists())
        self.assertFalse(self.target_asset.exists())

    def test_required_sponsored_anchor_is_enforced(self):
        article = json.loads(self.source_article.read_text(encoding="utf-8"))
        article["body_html"] = article["body_html"].replace("le faire estimé", "faire estimer")
        self.source_article.write_text(json.dumps(article), encoding="utf-8")
        self.manifest["article"]["sha256"] = self._sha256(self.source_article)
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")

        with self.assertRaisesRegex(ValueError, "required sponsored link"):
            publish_due_prepared_article(
                self.repo,
                now=datetime(2026, 9, 25, 6, 17, tzinfo=timezone.utc),
            )
        self.assertFalse(self.target_article.exists())


if __name__ == "__main__":
    unittest.main()
