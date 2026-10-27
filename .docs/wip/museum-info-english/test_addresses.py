import unittest
from build_addresses import matches, detail, region_matches
from research_addresses import parts

class AddressTest(unittest.TestCase):
    def setUp(self):
        self.address={'rn':'세종대로','buldMnnm':'175','buldSlno':'0','udrtYn':'0','roadAddrPart1':'서울특별시 종로구 세종대로 175'}

    def test_exact_street_building_and_region_required(self):
        self.assertTrue(matches('서울 종로구 세종대로 175',self.address))
        for wrong in ['서울 종로구 세종대로 175-1','서울 중구 세종대로 175','부산 종로구 세종대로 175']:
            self.assertFalse(matches(wrong,self.address))

    def test_underground_road_number_is_not_surface_building(self):
        underground={**self.address,'udrtYn':'1'}
        self.assertFalse(matches('서울 종로구 세종대로 175',underground))

    def test_administrative_rename_retains_district(self):
        self.assertTrue(region_matches('광주광역시 동구','전남광주통합특별시 동구'))
        self.assertFalse(region_matches('광주광역시 동구','전남광주통합특별시 북구'))
        self.assertTrue(region_matches('경기 화성시','경기도 화성시 병점구'))

    def test_floors_and_rooms_are_preserved(self):
        self.assertEqual(detail(1,'2층'),'2F')
        self.assertEqual(detail(1,'지하 1층'),'B1')
        self.assertEqual(detail(1,'B1(북문로3가)'),'B1')
        self.assertEqual(detail(1,', 102호'),'Room 102')
        self.assertEqual(detail(1,'(2층, 3층)'),'2F/3F')
        with self.assertRaises(ValueError):detail(1,'미확인상세')

    def test_two_building_numbers_are_not_dropped(self):
        result=parts('서울 종로구 인사동길 35-4, 35-6')
        self.assertEqual([p['query'] for p in result],['서울 종로구 인사동길 35-4','서울 종로구 인사동길 35-6'])

    def test_two_addresses_are_not_truncated(self):
        result=parts('제주 제주시 산지로 37-5/제주 제주시 산지로 23')
        self.assertEqual(len(result),2)
        self.assertTrue(result[1]['query'].endswith('산지로 23'))

if __name__=='__main__':unittest.main()
