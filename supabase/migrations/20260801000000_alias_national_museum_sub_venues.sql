-- 국립중앙박물관 대강당/어린이박물관, 국립박물관문화재단은 국립중앙박물관 부속 시설/재단이라
-- 별도 museums 행을 만드는 대신 exhibitions.venue_name_fallback을 본관 이름으로 통일해서
-- 기존 국립중앙박물관 마커에 묶이게 한다.
update public.exhibitions
set venue_name_fallback = '국립중앙박물관'
where venue_name_fallback in (
  '국립중앙박물관 대강당',
  '국립중앙박물관 어린이박물관',
  '국립박물관문화재단'
);
