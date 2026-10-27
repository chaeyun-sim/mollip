"""Reviewed deterministic translations for museum closure/opening-hour text.

No paid translation API; no inference that missing closure information means open.
"""
import collections
import csv
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
DAYS = dict(zip('월화수목금토일', ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']))

CLOSURES = {
    '11/1': 'Nov 1',
    '3월/11월 첫 번째 월요일': 'First Mon in Mar/Nov',
    '4월/11월 첫번째 주 월요일': 'First Mon in Apr/Nov',
    'dnjf': 'Mon',
    '매월 첫 번째 월요일': 'First Mon of each month',
    '매주 월요일, 1월 1일, 설·추석 당일, 기타 박물관장이 지정한 날': 'Every Mon, Jan 1, Seollal and Chuseok days, and other days designated by the museum director',
    '월(월요일이 공휴일인 경우 정상 개관)': 'Mon (open if Mon is a public holiday)',
    '월, 12/31': 'Mon, Dec 31',
    '월, 12~1월': 'Mon, Dec–Jan',
    '일/월(매월 둘째, 넷째)': 'Sun/Mon (2nd and 4th of each month)',
    '일/월, 화 (사전 예약제)': 'Sun/Mon, Tue (advance reservation required)',
}


def closure(value):
    if value is None or not value.strip():
        return None
    if value in CLOSURES:
        return CLOSURES[value]
    simple = value.replace('요일','')
    if re.fullmatch('[월화수목금토일](?:/[월화수목금토일])*', simple):
        return '/'.join(DAYS[part] for part in simple.split('/'))
    raise ValueError(f'Unreviewed closure: {value!r}')


def opening(value):
    if value is None or not value.strip():
        return None
    if value.strip() == '10:00-09:00':
        return None  # Ambiguous source: do not invent a closing time.
    text = value.strip()
    exact = {
        '상시 개방': 'Always open',
        '전시 일정에 따라 변동': 'Hours vary by exhibition',
        '전시·행사 일정에 따라 운영': 'Hours depend on exhibition/event schedules',
        '10:00-17:00 (12시부터 점심시간)': '10:00-17:00 (lunch break from 12:00)',
        '10:00-18:00 (5~9월 19시까지)': '10:00-18:00 (May–Sep until 19:00)',
        '10:00~18:00 (입장 마감 17:30) / 야간연장개관 18:00~20:00 (3월~10월 매주 토요일)': '10:00-18:00 (last admission 17:30) / extended evening hours 18:00-20:00 (every Sat, Mar–Oct)',
    }
    if text in exact:
        return exact[text]
    # Convert month ranges before converting the single-character Korean weekdays.
    text = re.sub(r'(\d{1,2})월?\s*[~～]\s*(\d{1,2})월', lambda m:MONTHS[int(m[1])]+'–'+MONTHS[int(m[2])], text)
    text = re.sub(r'(\d{1,2})시', lambda m:m[1]+':00', text)
    phrases = {
        '프로그램에 따라 유동적':'varies by program',
        '프로그램에 따라 다름':'varies by program',
        '평일 및 토요일':'Weekdays and Sat',
        '평일':'Weekdays', '주말':'Weekends', '주밀':'Weekends',
        '하절기':'Summer', '동절기':'Winter',
        '입장 마감':'last admission', '입장마감':'last admission',
        '브레이크타임':'break', '점심시간':'lunch break',
        '공휴일':'Public holidays', '유동적':'subject to change', '변동':'subject to change',
        '1회차':'Session 1', '2회차':'Session 2',
        '제외':'closed', '까지':'',
    }
    for source, target in phrases.items():
        text = text.replace(source,target)
    text = re.sub(r'([월화수목금토일])(?:요일)?',lambda m:DAYS[m[1]],text)
    text = text.replace('는','').replace('은','')
    # Make 'until' explicit wherever the Korean source specifies a seasonal/day exception.
    text = re.sub(r'((?:Summer|Winter)(?:\s+Weekends)?|Sat|Wed/Sat)\s+(\d{1,2}:\d{2})(?=[,)])',r'\1 until \2',text)
    text = text.replace('(12:00~13:00 closed)','(closed 12:00-13:00)')
    text = re.sub(r'(\d{1,2}:\d{2})\s*[~～–]\s*(\d{1,2}:\d{2})',r'\1-\2',text)
    text = re.sub(r'(?<=[A-Za-z])~(?=[A-Za-z])','–',text)
    text = text.replace('))',')')
    if re.search('[가-힣]',text):
        raise ValueError(f'Untranslated hours: {value!r} -> {text!r}')
    return text


def times(value):
    # Compare time endpoints including Korean '17시' -> '17:00'.
    value = re.sub(r'(\d{1,2})시',r'\1:00',value or '')
    return collections.Counter((int(h),int(m)) for h,m in re.findall(r'(\d{1,2}):(\d{2})',value))


if __name__ == '__main__':
    rows = json.loads((ROOT/'before.json').read_text())
    maps = {field:{} for field in ['rstdeInfo','open_hours']}
    for field,translate in [('rstdeInfo',closure),('open_hours',opening)]:
        for value in sorted({r[field] for r in rows if r[field] is not None}):
            translated = translate(value)
            if field=='open_hours' and translated:
                assert times(value)==times(translated),(value,translated)
            maps[field][value] = translated
    (ROOT/'translations.json').write_text(json.dumps(maps,ensure_ascii=False,indent=2))
    with (ROOT/'translation-review.csv').open('w',encoding='utf-8-sig',newline='') as handle:
        writer=csv.writer(handle);writer.writerow(['field','source','english'])
        for field,values in maps.items():
            writer.writerows((field,k,v) for k,v in values.items())
    print(json.dumps(maps,ensure_ascii=False,indent=2))
