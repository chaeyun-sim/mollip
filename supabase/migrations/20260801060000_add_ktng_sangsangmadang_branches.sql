-- KT&G 상상마당은 춘천 지점만 등록돼 있었는데, 홍대/논산/대치/부산 지점을 추가한다.
-- 좌표는 OpenStreetMap 지오코딩 결과라 근사치다 (논산은 상월면 단위까지만 정확 —
-- 정확한 건물 주소로는 매칭 안 돼서 면 소재지 좌표로 대체됨, 필요하면 나중에 보정).
insert into public.museums (name, address, phone, homepage_url, gps_x, gps_y, open_hours)
values
  ('KT&G 상상마당 홍대', '서울특별시 마포구 어울마당로 65', '02-330-6200', 'https://www.sangsangmadang.com/main/HD', '126.9210678', '37.5509886', null),
  ('KT&G 상상마당 논산', '충청남도 논산시 상월면 한천길 15-20', '041-734-6980', 'https://www.sangsangmadang.com/main/NS', '127.1627823', '36.2926189', null),
  ('KT&G 상상마당 대치', '서울특별시 강남구 영동대로 416', '02-3404-4311', null, '127.0653312', '37.5065771', null),
  ('KT&G 상상마당 부산', '부산광역시 부산진구 서면로 39', '051-809-5555', 'https://www.sangsangmadang.com/main/BS', '129.0576071', '35.1521720', '10:00~22:00');
