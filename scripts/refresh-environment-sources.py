"""Verify the published Bruitparif communal model schema; publish no personal data."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

FIELDS = ['INSEE','NOM','POP','RLden_s68','RLn_s62','FLden_s73','FLn_s65','ALden_s55','ALn_s50']
PARAMS = {'MAP':'/io/data/CSB4/wTerritoires_IDF_StatsPopExpo.qgs','SERVICE':'WFS','REQUEST':'DescribeFeatureType','TYPENAME':'Communes_IDF_StatsPopExpo'}
URL = 'https://gis.bruitparif.fr/ows/?' + urllib.parse.urlencode(PARAMS)

def prepare_manifest(raw, today):
    if len(raw)>500000: raise ValueError('Unexpected source schema size')
    root=ET.fromstring(raw)
    fields={element.attrib.get('name'):element.attrib.get('type') for element in root.iter() if element.tag.rsplit('}',1)[-1]=='element'}
    if not all(field in fields and fields[field] == ('string' if field in ['INSEE','NOM'] else 'integer') for field in FIELDS):
        raise ValueError('Published communal noise schema changed')
    digest=hashlib.sha256(raw).hexdigest()
    verified=dt.datetime.combine(today,dt.time.min,tzinfo=dt.timezone.utc)
    return {'schema_version':1,'version':f'bruitparif-csb4-2022-{today.isoformat()}-{digest[:8]}','data_year':2022,
      'verified_at':verified.isoformat().replace('+00:00','Z'),'expires_at':(verified+dt.timedelta(days=35)).isoformat().replace('+00:00','Z'),
      'source_schema_url':URL,'source_schema_sha256':digest,'fields':FIELDS,
      'source_url':'https://carto.bruitparif.fr/','license_url':'https://www.bruitparif.fr/licence-ouverte/',
      'attribution':'Source : Bruitparif, cartes stratégiques de bruit, échéance 2022.',
      'scope':'Modelled communal population exposure by noise source and Lden/Ln threshold. No measured dwelling decibels. Population belongs to the model reference, not the current census.'}

def main():
    with urllib.request.urlopen(URL,timeout=25) as response: raw=response.read(500001)
    manifest=prepare_manifest(raw,dt.datetime.now(dt.timezone.utc).date())
    target=Path(__file__).resolve().parents[1]/'public/data/environment/bruitparif-current.json'
    target.parent.mkdir(parents=True,exist_ok=True)
    temporary=target.with_suffix('.tmp');temporary.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');temporary.replace(target)
    print(json.dumps({'version':manifest['version'],'fields_verified':len(FIELDS),'scope':'commune','personal_data':False}))

if __name__=='__main__': main()
