#!/usr/bin/env python3
"""Compute the sealed Bordeaux DVF medians without third-party packages."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import statistics
from collections import Counter, defaultdict
from pathlib import Path


BORDEAUX_INSEE = "33063"
ALLOWED_TYPES = ("Appartement", "Maison")
MIN_PRICE_EUR_M2 = 500
MAX_PRICE_EUR_M2 = 15_000


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def point_in_ring(x: float, y: float, ring: list[list[float]]) -> bool:
    inside = False
    previous = len(ring) - 1
    for index, point in enumerate(ring):
        xi, yi = point[:2]
        xj, yj = ring[previous][:2]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        previous = index
    return inside


def load_neighbourhoods(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as source:
        collection = json.load(source)

    neighbourhoods = []
    for feature in collection["features"]:
        properties = feature["properties"]
        if properties.get("insee") != BORDEAUX_INSEE or properties.get("valide") != "True":
            continue
        if feature["geometry"]["type"] != "Polygon":
            raise ValueError(f"Unsupported geometry for {properties['nom']}")
        rings = feature["geometry"]["coordinates"]
        exterior = rings[0]
        neighbourhoods.append(
            {
                "name": properties["nom"],
                "rings": rings,
                "bounds": (
                    min(point[0] for point in exterior),
                    min(point[1] for point in exterior),
                    max(point[0] for point in exterior),
                    max(point[1] for point in exterior),
                ),
            }
        )
    if len(neighbourhoods) != 8:
        raise ValueError(f"Expected 8 valid Bordeaux neighbourhoods, got {len(neighbourhoods)}")
    return neighbourhoods


def locate_neighbourhood(x: float, y: float, neighbourhoods: list[dict]) -> str | None:
    for neighbourhood in neighbourhoods:
        min_x, min_y, max_x, max_y = neighbourhood["bounds"]
        if not (min_x <= x <= max_x and min_y <= y <= max_y):
            continue
        exterior, *holes = neighbourhood["rings"]
        if point_in_ring(x, y, exterior) and not any(
            point_in_ring(x, y, hole) for hole in holes
        ):
            return neighbourhood["name"]
    return None


def quantile(values: list[float], ratio: float) -> float:
    ordered = sorted(values)
    position = (len(ordered) - 1) * ratio
    low = math.floor(position)
    high = math.ceil(position)
    if low == high:
        return ordered[low]
    return ordered[low] * (high - position) + ordered[high] * (position - low)


def load_mutations(path: Path, neighbourhoods: list[dict]) -> tuple[list[dict], Counter, int]:
    grouped = defaultdict(list)
    with path.open(newline="", encoding="utf-8") as source:
        for row in csv.DictReader(source):
            grouped[row["id_mutation"]].append(row)

    selected = []
    rejected = Counter()
    for mutation_id, rows in grouped.items():
        if rows[0]["nature_mutation"] != "Vente":
            rejected["not_sale"] += 1
            continue
        try:
            value = float(rows[0]["valeur_fonciere"])
        except (TypeError, ValueError):
            rejected["invalid_value"] += 1
            continue

        residential = []
        for row in rows:
            if row["type_local"] not in ALLOWED_TYPES:
                continue
            try:
                surface = float(row["surface_reelle_bati"])
            except (TypeError, ValueError):
                surface = 0
            if surface > 0:
                residential.append((row, surface))

        if len(residential) != 1:
            rejected[f"residential_local_count_{len(residential)}"] += 1
            continue

        row, surface = residential[0]
        price = value / surface
        if not MIN_PRICE_EUR_M2 <= price <= MAX_PRICE_EUR_M2:
            rejected["price_outside_bounds"] += 1
            continue
        try:
            longitude = float(row["longitude"])
            latitude = float(row["latitude"])
        except (TypeError, ValueError):
            rejected["missing_coordinates"] += 1
            continue
        neighbourhood = locate_neighbourhood(longitude, latitude, neighbourhoods)
        if neighbourhood is None:
            rejected["outside_valid_neighbourhood"] += 1
            continue
        selected.append(
            {
                "id": mutation_id,
                "type": row["type_local"],
                "price_eur_m2": price,
                "neighbourhood": neighbourhood,
            }
        )
    return selected, rejected, len(grouped)


def type_summary(rows: list[dict], property_type: str) -> dict:
    prices = [row["price_eur_m2"] for row in rows if row["type"] == property_type]
    return {
        "n": len(prices),
        "median_eur_m2": round(statistics.median(prices)),
        "q1_eur_m2": round(quantile(prices, 0.25)),
        "q3_eur_m2": round(quantile(prices, 0.75)),
    }


def verify_against_evidence(result: dict, evidence_path: Path) -> None:
    with evidence_path.open(encoding="utf-8") as source:
        evidence = json.load(source)

    errors = []

    def compare(label: str, expected, actual) -> None:
        if expected != actual:
            errors.append(f"{label}: expected {expected!r}, got {actual!r}")

    compare(
        "DVF 2024 SHA-256",
        evidence["years"]["2024"]["source_sha256"],
        result["input_sha256"]["dvf_2024"],
    )
    compare(
        "DVF 2025 SHA-256",
        evidence["years"]["2025"]["source_sha256"],
        result["input_sha256"]["dvf_2025"],
    )
    compare(
        "neighbourhoods SHA-256",
        evidence["neighbourhood_source"]["source_sha256"],
        result["input_sha256"]["neighbourhoods"],
    )
    compare(
        "valid neighbourhood count",
        evidence["neighbourhood_source"]["selected_valid_features"],
        len(result["neighbourhoods_2025"]),
    )

    for year in ("2024", "2025"):
        expected_year = evidence["years"][year]
        actual_year = result["years"][year]
        for key in ("all_mutations", "selected_mutations"):
            compare(f"{year}.{key}", expected_year[key], actual_year[key])
        for property_type in ("apartments", "houses"):
            for key, expected in expected_year[property_type].items():
                compare(
                    f"{year}.{property_type}.{key}",
                    expected,
                    actual_year[property_type][key],
                )

    compare(
        "neighbourhood names",
        sorted(evidence["neighbourhoods_2025"]),
        sorted(result["neighbourhoods_2025"]),
    )
    for name, expected_neighbourhood in evidence["neighbourhoods_2025"].items():
        actual_neighbourhood = result["neighbourhoods_2025"].get(name, {})
        compare(
            f"{name}.selected_mutations",
            expected_neighbourhood["selected_mutations"],
            actual_neighbourhood.get("selected_mutations"),
        )
        for property_type in ("apartments", "houses"):
            actual_type = actual_neighbourhood.get(property_type, {})
            for key, expected in expected_neighbourhood[property_type].items():
                compare(
                    f"{name}.{property_type}.{key}",
                    expected,
                    actual_type.get(key),
                )

    if errors:
        raise SystemExit("Evidence verification failed:\n" + "\n".join(errors))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dvf-2024", required=True, type=Path)
    parser.add_argument("--dvf-2025", required=True, type=Path)
    parser.add_argument("--neighbourhoods", required=True, type=Path)
    parser.add_argument("--verify-evidence", type=Path)
    args = parser.parse_args()

    neighbourhoods = load_neighbourhoods(args.neighbourhoods)
    rows_by_year = {}
    result = {
        "input_sha256": {
            "dvf_2024": sha256(args.dvf_2024),
            "dvf_2025": sha256(args.dvf_2025),
            "neighbourhoods": sha256(args.neighbourhoods),
        },
        "years": {},
    }
    for year, path in (("2024", args.dvf_2024), ("2025", args.dvf_2025)):
        rows, rejected, all_mutations = load_mutations(path, neighbourhoods)
        rows_by_year[year] = rows
        result["years"][year] = {
            "all_mutations": all_mutations,
            "selected_mutations": len(rows),
            "apartments": type_summary(rows, "Appartement"),
            "houses": type_summary(rows, "Maison"),
            "rejected": dict(sorted(rejected.items())),
        }

    for key in ("apartments", "houses"):
        current = result["years"]["2025"][key]["median_eur_m2"]
        previous = result["years"]["2024"][key]["median_eur_m2"]
        result["years"]["2025"][key]["change_from_2024_pct"] = round(
            (current / previous - 1) * 100, 1
        )

    result["neighbourhoods_2025"] = {}
    for neighbourhood in sorted(item["name"] for item in neighbourhoods):
        rows = [
            row
            for row in rows_by_year["2025"]
            if row["neighbourhood"] == neighbourhood
        ]
        result["neighbourhoods_2025"][neighbourhood] = {
            "selected_mutations": len(rows),
            "apartments": type_summary(rows, "Appartement"),
            "houses": type_summary(rows, "Maison"),
        }

    if args.verify_evidence:
        verify_against_evidence(result, args.verify_evidence)

    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
