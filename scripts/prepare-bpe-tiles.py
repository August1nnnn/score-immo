"""Prepare public, anonymous BPE equipment tiles from the official monthly ZIP.

Only type and rounded coordinates survive. No name, address or SIRET is copied.
Rows with partial diffusion or uncertain address placement are excluded.
"""
import argparse
import collections
import csv
import datetime as dt
import gzip
import hashlib
import io
import json
import math
from pathlib import Path
import zipfile

SOURCE_URL = 'https://www.insee.fr/fr/statistiques/fichier/8217525/BPE25.zip'
SOURCE_PAGE = 'https://www.insee.fr/fr/statistiques/8217525'
TILE_SIZE = 0.25


def equipment_category(code):
    if code.startswith('D'): return 'health'
    if code.startswith(('B1', 'B2')): return 'shops'
    if code.startswith('B'): return 'shops_other'
    if code == 'A504': return 'food'
    if code.startswith('A1') or code in ('A203', 'A206', 'A207', 'A208'): return 'services'
    if code in ('E102', 'E107', 'E108', 'E109'): return 'transport'
    if code.startswith('F'): return 'leisure'
    return None


def public_point(row):
    if row.get('STATUT_DIFFUSION') not in ('O', '_Z'): return None, 'diffusion'
    if row.get('QUALITE_XY') != 'B': return None, 'coordinate_quality'
    if row.get('QUALITE_GEOLOC') not in ('11', '_Z'): return None, 'address_precision'
    category = equipment_category(row.get('TYPEQU', ''))
    if not category: return None, 'outside_categories'
    try:
        lat = float(row['LATITUDE']); lon = float(row['LONGITUDE'])
        if not math.isfinite(lat) or not math.isfinite(lon) or not -90 <= lat <= 90 or not -180 <= lon <= 180: return None, 'coordinates'
    except (ValueError, KeyError): return None, 'coordinates'
    return [row['TYPEQU'], round(lat * 10000), round(lon * 10000)], None


def tile_key(point):
    return f'{math.floor((point[2] / 10000 + 180) / TILE_SIZE)}_{math.floor((point[1] / 10000 + 90) / TILE_SIZE)}'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--zip', required=True, type=Path)
    parser.add_argument('--types', required=True, type=Path)
    parser.add_argument('--published', required=True)
    parser.add_argument('--verified', required=True)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    source_date = dt.date.fromisoformat(args.published)
    verified_date = dt.date.fromisoformat(args.verified)
    if verified_date < source_date or verified_date > dt.datetime.now(dt.timezone.utc).date(): raise SystemExit('Invalid verification date')
    digest = hashlib.sha256(args.zip.read_bytes()).hexdigest()
    version = f'2025-{verified_date.isoformat()}-{digest[:8]}'
    root = args.out / version
    if root.exists(): raise SystemExit('Refusing to overwrite an immutable dataset version')
    root.mkdir(parents=True)
    tiles = collections.defaultdict(list)
    rejected = collections.Counter(); categories = collections.Counter(); total = 0
    required = {'AN','TYPEQU','STATUT_DIFFUSION','QUALITE_XY','QUALITE_GEOLOC','LONGITUDE','LATITUDE'}
    with zipfile.ZipFile(args.zip) as archive:
        names = [name for name in archive.namelist() if name.lower().endswith('.csv')]
        if len(names) != 1: raise SystemExit('Ambiguous source archive')
        rows = csv.DictReader(io.TextIOWrapper(archive.open(names[0]), encoding='utf-8-sig'), delimiter=';')
        if not required.issubset(rows.fieldnames or []): raise SystemExit('BPE source schema changed')
        for row in rows:
            total += 1
            if row['AN'] != '2025': raise SystemExit('BPE year changed; review the new source before processing')
            point, reason = public_point(row)
            if reason: rejected[reason] += 1
            else:
                tiles[tile_key(point)].append(point)
                categories[equipment_category(point[0])] += 1
            if total % 500000 == 0: print(f'Processed {total} rows', flush=True)
    accepted = sum(categories.values())
    if total < 1000000 or accepted < 100000 or len(tiles) > 10000:
        raise SystemExit('Dataset size outside expected bounds; do not publish')
    descriptions = {}
    with args.types.open(encoding='utf-8-sig') as handle:
        for row in csv.DictReader(handle):
            category = equipment_category(row['TYPEQU'])
            if category: descriptions[row['TYPEQU']] = {'label': row['LIBELLE_TYPEQU'].capitalize(), 'category': category}
    entries = {}; compressed_bytes = 0; max_decoded = 0
    for key, points in sorted(tiles.items()):
        points.sort(key=lambda point: (point[0], point[1], point[2]))
        raw = json.dumps(points, ensure_ascii=False, separators=(',', ':')).encode()
        packed = gzip.compress(raw, mtime=0)
        if len(raw) > 8000000 or len(packed) > 2000000: raise SystemExit('A tile exceeds the bounded Edge parsing budget')
        filename = key + '.json.gz'
        (root / filename).write_bytes(packed)
        entries[key] = {'file': filename, 'points': len(points), 'bytes': len(packed), 'decoded_bytes': len(raw), 'sha256': hashlib.sha256(packed).hexdigest()}
        compressed_bytes += len(packed); max_decoded = max(max_decoded, len(raw))
    manifest = {
        'schema_version': 1, 'dataset': 'INSEE BPE', 'year': '2025', 'version': version,
        'source_url': SOURCE_URL, 'source_page': SOURCE_PAGE, 'source_sha256': digest,
        'source_published_at': source_date.isoformat(),
        'verified_at': verified_date.isoformat(),
        'expires_at': (verified_date + dt.timedelta(days=35)).isoformat() + 'T00:00:00Z',
        'license': 'Licence Ouverte / Open Licence 2.0', 'tile_size': TILE_SIZE, 'coordinate_scale': 10000,
        'fields': ['equipment_type', 'latitude_scaled', 'longitude_scaled'],
        'selection': {'diffusion': ['O','_Z'], 'coordinate_quality': ['B'], 'address_precision': ['11','_Z']},
        'scope': 'Precisely located, publicly diffusible equipment only; partial inventory, not current opening status.',
        'source_rows': total, 'accepted_rows': accepted, 'rejected_rows': dict(rejected),
        'category_rows': dict(categories), 'compressed_bytes': compressed_bytes, 'largest_decoded_tile': max_decoded,
        'types': descriptions, 'tiles': entries,
    }
    (root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    current = args.out / '.current.json.tmp'
    current.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    current.replace(args.out / 'current.json')
    print(json.dumps({key: manifest[key] for key in ['version','source_rows','accepted_rows','rejected_rows','category_rows','compressed_bytes','largest_decoded_tile']}), flush=True)
    print('tile_files', len(tiles), flush=True)


if __name__ == '__main__': main()
