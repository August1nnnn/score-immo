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
