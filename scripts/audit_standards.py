"""STACK-2026 Standards Audit (generic, structure-agnostic).

Detects project structure automatically (site/src or src, site/dist or dist)
and runs these checks :

1. Em-dashes / en-dashes in source (STACK-2026 hard rule, must be 0)
2. Canonical / OG / JSON-LD Organization / title / description presence
3. Heading : exactly 1 H1 per page
4. Images without alt or aria-hidden
5. Noindex pages are skipped for signals (meta-refresh redirects)

Run : python3 scripts/audit_standards.py
Exit 1 if em-dashes found (CI fail), 0 otherwise.
"""
from __future__ import annotations
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent if __file__.endswith("scripts/audit_standards.py") else Path.cwd()
SRC = next((c for c in [ROOT / "site" / "src", ROOT / "src"] if c.exists()), None)
DIST = next((c for c in [ROOT / "site" / "dist", ROOT / "dist"] if c.exists()), None)

report: dict[str, list] = defaultdict(list)

# 1. Em-dashes / en-dashes in source
if SRC:
    for p in SRC.rglob("*"):
        if not p.is_file() or p.suffix not in (".astro", ".ts", ".tsx", ".jsx", ".js", ".md", ".mjs", ".css", ".vue", ".svelte"):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        for m in re.finditer(r"[—–]", text):
            line = text[: m.start()].count("\n") + 1
            char = "em" if text[m.start()] == "—" else "en"
            report["dashes"].append(f"{p.relative_to(ROOT)}:{line} [{char}]")

# 2-5. Dist checks (only if dist built)
if DIST:
    for html_file in DIST.rglob("index.html"):
        rel = "/" + html_file.parent.relative_to(DIST).as_posix()
        try:
            html = html_file.read_text(encoding="utf-8")
        except Exception:
            continue
        # Skip noindex transition pages
        if re.search(r'<meta[^>]*name=["\']robots["\'][^>]*noindex', html, re.IGNORECASE):
            continue
        if 'rel="canonical"' not in html:
            report["missing_canonical"].append(rel)
        if 'property="og:image"' not in html or 'property="og:url"' not in html:
            report["missing_og"].append(rel)
        if '"@type":"Organization"' not in html and '"@type": "Organization"' not in html:
            report["missing_jsonld_org"].append(rel)
        if "<title>" not in html:
            report["missing_title"].append(rel)
        if 'name="description"' not in html:
            report["missing_description"].append(rel)
        h1s = len(re.findall(r"<h1\b", html, re.IGNORECASE))
        if h1s == 0:
            report["heading_issues"].append(f"{rel} : 0 H1")
        elif h1s > 1:
            report["heading_issues"].append(f"{rel} : {h1s} H1")
        # Images without alt
        for m in re.finditer(r"<img\b([^>]*)>", html, re.IGNORECASE):
            attrs = m.group(1)
            if "aria-hidden" in attrs:
                continue
            if not re.search(r'\balt\s*=', attrs):
                report["img_no_alt"].append(rel)
                break

# Output
print("=" * 60)
print("STACK-2026 Standards Audit")
print("=" * 60)
print(f"Src : {SRC}")
print(f"Dist: {DIST}")

exit_code = 0
for key in ["dashes", "missing_canonical", "missing_og", "missing_jsonld_org",
            "missing_title", "missing_description", "heading_issues", "img_no_alt"]:
    items = report.get(key, [])
    status = "FAIL" if items else "OK"
    print(f"\n[{status}] {key} ({len(items)})")
    for item in items[:12]:
        print(f"  {item}")
    if len(items) > 12:
        print(f"  ... +{len(items) - 12} more")
    if key == "dashes" and items:
        exit_code = 1

print()
sys.exit(exit_code)
