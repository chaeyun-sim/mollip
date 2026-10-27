import unittest
from translate import closure, opening, times


class TranslationTest(unittest.TestCase):
    def test_unknown_closure_does_not_claim_no_closure(self):
        self.assertIsNone(closure(None))
        self.assertIsNone(closure(''))
        self.assertIsNone(closure('  '))

    def test_day_groups_keep_slash_separator(self):
        self.assertEqual(closure('월'),'Mon')
        self.assertEqual(closure('일/월'),'Sun/Mon')
        self.assertEqual(closure('월/화/수'),'Mon/Tue/Wed')

    def test_ordinal_and_reservation_conditions_survive(self):
        self.assertEqual(closure('4월/11월 첫번째 주 월요일'),'First Mon in Apr/Nov')
        self.assertEqual(closure('일/월, 화 (사전 예약제)'),'Sun/Mon, Tue (advance reservation required)')
        self.assertEqual(closure('월(월요일이 공휴일인 경우 정상 개관)'),'Mon (open if Mon is a public holiday)')

    def test_invalid_opening_time_is_not_guessed(self):
        self.assertIsNone(opening('10:00-09:00'))

    def test_lunch_does_not_gain_an_invented_end_time(self):
        self.assertEqual(opening('10:00-17:00 (12시부터 점심시간)'),'10:00-17:00 (lunch break from 12:00)')

    def test_season_and_last_admission_are_preserved(self):
        raw='10:00~18:00 (입장 마감 17:30) / 야간연장개관 18:00~20:00 (3월~10월 매주 토요일)'
        en=opening(raw)
        self.assertIn('last admission 17:30',en)
        self.assertIn('every Sat, Mar–Oct',en)
        self.assertEqual(times(raw),times(en))
        self.assertEqual(opening('3~10월 09:00-18:00\n11~2월 09:00-17:00'),'Mar–Oct 09:00-18:00\nNov–Feb 09:00-17:00')

    def test_unknown_new_copy_must_be_reviewed(self):
        with self.assertRaises(ValueError):
            closure('임시 휴관')
        with self.assertRaises(ValueError):
            opening('행사일만 개방')


if __name__=='__main__':
    unittest.main()
