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
AIR_RESOURCE = 'd2b9e8e6-8b0b-4bb6-9851-b4fa2efc8201'
AIR_CATALOG = 'https://www.data.gouv.fr/api/1/datasets/6149925a2ff0ab6cebdd6fe8/'
AIR_TEXT = ['code_zone','type_zone','date_ech','date_maj','date_dif','source']
AIR_NUMBER = ['code_qual','code_pm25','code_pm10','code_no2','code_o3','code_so2']

def air_layer(metadata):
    import re
    if metadata.get('organization',{}).get('id')!='5dfa3aba8b4c4127a6038f64': raise ValueError('Unexpected air producer')
    resource=next((r for r in metadata.get('resources',[]) if r.get('id')==AIR_RESOURCE and r.get('format')=='csv'),None)
    if not resource: raise ValueError('Published air resource missing')
    url=urllib.parse.urlsplit(resource['url'])
    if url.scheme!='https' or url.netloc!='data.atmo-france.org' or url.path!='/geoserver/ind/ows': raise ValueError('Unexpected air origin')
    params={k.lower():v for k,v in urllib.parse.parse_qsl(url.query)}
    layer=params.get('typenames','')
    if not re.fullmatch(r'ind_atmo_\d{4}',layer) or params.get('request')!='GetFeature': raise ValueError('Unexpected air layer')
    return layer

def prepare_air_manifest(metadata,raw,today):
    layer=air_layer(metadata)
    if len(raw)>500000: raise ValueError('Unexpected air schema size')
    root=ET.fromstring(raw)
    fields={e.attrib.get('name'):e.attrib.get('type','').split(':')[-1] for e in root.iter() if e.tag.rsplit('}',1)[-1]=='element'}
    if not all(fields.get(f)=='string' for f in AIR_TEXT) or not all(fields.get(f) in ['double','integer','int'] for f in AIR_NUMBER): raise ValueError('Published air schema changed')
    digest=hashlib.sha256(raw).hexdigest();verified=dt.datetime.combine(today,dt.time.min,tzinfo=dt.timezone.utc)
    return {'schema_version':1,'version':f'atmo-public-{today.isoformat()}-{digest[:8]}','layer':layer,'resource_id':AIR_RESOURCE,
      'verified_at':verified.isoformat().replace('+00:00','Z'),'expires_at':(verified+dt.timedelta(days=35)).isoformat().replace('+00:00','Z'),
      'source_schema_sha256':digest,'source_catalog_url':AIR_CATALOG,'fields':AIR_TEXT+AIR_NUMBER,
      'source_url':'https://www.data.gouv.fr/datasets/indice-de-la-qualite-de-lair-quotidien-par-commune-indice-atmo',
      'license':'ODbL-1.0','attribution':'Indice ATMO : Atmo France / AASQA, licence ODbL',
      'scope':'Daily communal forecast, not usual sector air quality or indoor air. Published data must match commune and day.'}

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
    with urllib.request.urlopen(AIR_CATALOG,timeout=25) as response: metadata=json.loads(response.read(500000))
    layer=air_layer(metadata)
    schema_url='https://data.atmo-france.org/geoserver/ind/ows?'+urllib.parse.urlencode({'service':'WFS','request':'DescribeFeatureType','typeName':layer})
    with urllib.request.urlopen(schema_url,timeout=25) as response: raw=response.read(500001)
    manifest=prepare_air_manifest(metadata,raw,dt.datetime.now(dt.timezone.utc).date())
    target=target.with_name('atmo-current.json');temporary=target.with_suffix('.tmp');temporary.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');temporary.replace(target)
    print(json.dumps({'version':manifest['version'],'layer':layer,'fields_verified':len(AIR_TEXT+AIR_NUMBER),'scope':'commune'}))

if __name__=='__main__': main()
