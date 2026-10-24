"""Refresh from the official publisher, validate locally, keep two snapshots."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/data/bpe'
PAGE = 'https://www.insee.fr/fr/statistiques/8217525'
DATA = 'https://www.insee.fr/fr/statistiques/fichier/8217525/BPE25.zip'
TYPES = 'https://www.insee.fr/fr/metadonnees/source/fichier/BPE25_table_passage.csv'

def download(url, path):
    request = urllib.request.Request(url, headers={'User-Agent':'ScoreImmo-equipment-maintenance/1.0 (+https://score-immo.fr)'})
    with urllib.request.urlopen(request, timeout=180) as response, path.open('wb') as handle:
        if response.status != 200: raise RuntimeError('Official source unavailable')
        shutil.copyfileobj(response,handle)
        return response.headers.get('Last-Modified')

def main():
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    with tempfile.TemporaryDirectory(prefix='scoreimmo-bpe-') as temporary:
        tmp = Path(temporary)
        page = urllib.request.urlopen(PAGE,timeout=30).read().decode('utf8')
        if '/BPE25.zip' not in page: raise RuntimeError('Official BPE edition changed; review source and schema')
        publication = re.search(r'paru-le-impression[^>]*>[^<]*</span></span>\s*(\d{2}/\d{2}/\d{4})', page)
        if not publication: raise RuntimeError('Official publication date unavailable')
        published = dt.datetime.strptime(publication[1],'%d/%m/%Y').date().isoformat()
        download(DATA,tmp/'source.zip')
        download(TYPES,tmp/'types.csv')
        digest = hashlib.sha256((tmp/'source.zip').read_bytes()).hexdigest()
        version = f'2025-{today}-{digest[:8]}'
        if (OUT/version/'manifest.json').exists():
            print('This verified immutable snapshot already exists; no mutation')
            return
        subprocess.run([sys.executable,str(ROOT/'scripts/prepare-bpe-tiles.py'),'--zip',str(tmp/'source.zip'),'--types',str(tmp/'types.csv'),'--published',published,'--verified',today,'--out',str(OUT)],check=True)
    # All of this directory is reproducibly generated from public source data.
    snapshots = sorted((path for path in OUT.iterdir() if path.is_dir() and re.fullmatch(r'2025-20\d{2}-\d{2}-\d{2}-[a-f0-9]{8}',path.name)),key=lambda path:path.name,reverse=True)
    for obsolete in snapshots[2:]: shutil.rmtree(obsolete)
    manifest=json.loads((OUT/'current.json').read_text())
    print(json.dumps({'version':manifest['version'],'verified_at':manifest['verified_at'],'expires_at':manifest['expires_at'],'equipment':manifest['accepted_rows'],'anonymous_fields_only':manifest['fields']}))

if __name__=='__main__': main()
