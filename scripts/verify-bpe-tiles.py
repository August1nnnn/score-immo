"""Validate the complete current anonymous BPE artifact before publication."""
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1] / 'public/data/bpe'
manifest = json.loads((root/'current.json').read_text())
now = dt.datetime.now(dt.timezone.utc)
assert manifest['schema_version'] == 1
assert re.fullmatch(r'2025-20\d{2}-\d{2}-\d{2}-[a-f0-9]{8}',manifest['version'])
assert manifest['fields'] == ['equipment_type','latitude_scaled','longitude_scaled']
assert manifest['selection'] == {'diffusion':['O','_Z'],'coordinate_quality':['B'],'address_precision':['11','_Z']}
verified = dt.datetime.fromisoformat(manifest['verified_at']).replace(tzinfo=dt.timezone.utc)
expires = dt.datetime.fromisoformat(manifest['expires_at'].replace('Z','+00:00'))
assert verified <= now < expires and expires-verified == dt.timedelta(days=35)
assert dt.date.fromisoformat(manifest['source_published_at']) <= verified.date()
snapshot = root/manifest['version']
assert json.loads((snapshot/'manifest.json').read_text()) == manifest
points = size = 0
assert 1 <= len(manifest['tiles']) <= 10000
for key,tile in manifest['tiles'].items():
    assert re.fullmatch(r'\d{1,4}_\d{1,3}',key)
    assert tile['file'] == key+'.json.gz'
    packed = (snapshot/tile['file']).read_bytes()
    assert len(packed) == tile['bytes'] <= 2000000
    assert hashlib.sha256(packed).hexdigest() == tile['sha256']
    raw = gzip.decompress(packed)
    assert len(raw) == tile['decoded_bytes'] <= 8000000
    rows = json.loads(raw)
    assert len(rows) == tile['points']
    for row in rows:
        assert isinstance(row,list) and len(row)==3 and row[0] in manifest['types']
        assert isinstance(row[1],int) and -900000 <= row[1] <= 900000
        assert isinstance(row[2],int) and -1800000 <= row[2] <= 1800000
    points += len(rows); size += len(packed)
assert points == manifest['accepted_rows'] and size == manifest['compressed_bytes']
assert len(list(root.rglob('*.gz'))) <= 20000-1000
print(json.dumps({'version':manifest['version'],'points':points,'compressed_bytes':size,'tiles':len(manifest['tiles']),'privacy_schema':'type and coordinates only','checksums':'all verified'},ensure_ascii=False))
