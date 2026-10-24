import datetime as dt
import importlib.util
from pathlib import Path
import unittest

path=Path(__file__).parents[1]/'scripts/refresh-environment-sources.py'
spec=importlib.util.spec_from_file_location('environment_sources',path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class NoiseSourceManifest(unittest.TestCase):
    def schema(self):
        return ('<schema>'+''.join(f'<element name="{field}" type="'+('string'if field in ['INSEE','NOM']else'integer')+'"/>'for field in module.FIELDS)+'</schema>').encode()
    def test_keeps_model_year_scope_and_source_verification_distinct(self):
        data=module.prepare_manifest(self.schema(),dt.date(2026,10,24))
        self.assertEqual(data['data_year'],2022);self.assertEqual(data['expires_at'],'2026-11-28T00:00:00Z')
        self.assertNotIn('db_estimate',data);self.assertEqual(len(data['source_schema_sha256']),64)
    def test_refuses_changed_fields_and_unbounded_schema(self):
        for raw in [b'<schema/>',self.schema().replace(b'name="POP"',b'name="OTHER"'),b'x'*500001]:
            with self.assertRaises(ValueError): module.prepare_manifest(raw,dt.date(2026,10,24))

class AirSourceManifest(unittest.TestCase):
    def metadata(self,url=None):
        return {'organization':{'id':'5dfa3aba8b4c4127a6038f64'},'resources':[{'id':'d2b9e8e6-8b0b-4bb6-9851-b4fa2efc8201','format':'csv','url':url or 'https://data.atmo-france.org/geoserver/ind/ows?service=WFS&request=GetFeature&TypeNames=ind_atmo_2021&outputformat=csv'}]}
    def schema(self):
        text_fields=['code_zone','type_zone','date_ech','date_maj','date_dif','source']
        number_fields=['code_qual','code_pm25','code_pm10','code_no2','code_o3','code_so2']
        return ('<schema>'+''.join(f'<element name="{f}" type="xsd:string"/>' for f in text_fields)+''.join(f'<element name="{f}" type="xsd:double"/>' for f in number_fields)+'</schema>').encode()
    def test_pins_the_official_published_layer_and_dated_schema(self):
        d=module.prepare_air_manifest(self.metadata(),self.schema(),dt.date(2026,10,24))
        self.assertEqual(d['layer'],'ind_atmo_2021');self.assertEqual(d['expires_at'],'2026-11-28T00:00:00Z')
        self.assertEqual(d['resource_id'],'d2b9e8e6-8b0b-4bb6-9851-b4fa2efc8201');self.assertEqual(len(d['source_schema_sha256']),64)
    def test_refuses_changed_hosts_resources_producer_or_schema(self):
        for metadata,schema in [(self.metadata('https://example.com/geoserver/ind/ows?TypeNames=ind_atmo_2021'),self.schema()),(self.metadata(),b'<schema/>'),({'organization':{'id':'other'},'resources':self.metadata()['resources']},self.schema())]:
            with self.assertRaises(ValueError):module.prepare_air_manifest(metadata,schema,dt.date(2026,10,24))
