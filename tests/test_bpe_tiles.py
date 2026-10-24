import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).parents[1] / 'scripts/prepare-bpe-tiles.py'
spec = importlib.util.spec_from_file_location('bpe_tiles', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PublicEquipmentSelection(unittest.TestCase):
    def setUp(self):
        self.row = {'STATUT_DIFFUSION':'O','QUALITE_XY':'B','QUALITE_GEOLOC':'11','TYPEQU':'B207','LATITUDE':'49.0356','LONGITUDE':'2.0569','NOMRS':'PRIVATE MARKER','SIRET':'PRIVATE MARKER','LIBVOIE':'PRIVATE MARKER'}

    def test_keeps_only_type_and_rounded_coordinates(self):
        point, reason = module.public_point(self.row)
        self.assertEqual(point, ['B207',490356,20569]); self.assertIsNone(reason)
        self.assertNotIn('PRIVATE MARKER', str(point))

    def test_excludes_suppressed_and_uncertain_locations(self):
        for field, value in [('STATUT_DIFFUSION','P'),('QUALITE_XY','M'),('QUALITE_XY','A'),('QUALITE_GEOLOC','12'),('QUALITE_GEOLOC','33'),('LATITUDE','NaN'),('LONGITUDE','')]:
            with self.subTest(field=field, value=value):
                self.assertIsNone(module.public_point({**self.row,field:value})[0])

    def test_a_station_is_not_confused_with_a_taxi_business(self):
        self.assertEqual(module.equipment_category('E108'),'transport')
        self.assertIsNone(module.equipment_category('E101'))


if __name__ == '__main__': unittest.main()
