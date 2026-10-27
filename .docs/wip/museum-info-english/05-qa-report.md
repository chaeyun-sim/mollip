# Museum information English data QA — final

Scope: museums.rstdeInfo_en, open_hours_en, address_en. Original Korean fields, name_en, amenities, parking, admission and accessibility were preserved. No application UI integration or commit was performed.

## Acceptance evidence

| Acceptance criterion | Final current DB | Verification |
| --- | --- | --- |
| Closure translation, including slash groups and exceptions | 364 populated | Initial closure backfill readback + originals preserved in address transaction |
| Unknown/empty closure is not treated as 'always open' | 88 NULL sources and 21 blank sources remain NULL | verification.json and final snapshot |
| Opening hours, seasons, lunch and last admission | 438 populated | Every reviewed numeric time endpoint preserved; readback matched |
| Official English address, including details | 473/473 populated and matched | Independent REST readback, address-verification.json |
| Original/other columns preserved | 0 differences since latest snapshot | Address SQL assertions + independent full-row comparison |
| Script tests | 13/13 passed | test_translate.py + test_addresses.py |
| tsc/Jest/simulator/interactions/UI regression | Not run / not applicable | Data-only operation; no app code/UI change; direct DB verification used |

## Source selection

- Final addresses: 472 via JUSO official address API, one via Chosun University's official English campus directions (id 878).
- JUSO matching requires road name + complete building number + compatible region. Underground station road numbers are rejected for above-ground source addresses.
- Province/district rename handling preserves the street and building. No floor or unit is dropped. Addresses containing two locations or two building numbers preserve both.
- API keys were read locally and sent only in POST bodies; they were not written to result files.
- id 5: official museum address Dunsan-daero 157 supersedes source number 152 for the English value. Source: https://www.leeungnomuseum.or.kr/Menu.do?menuId=0402
- id 14: official museum number 484-7 supersedes source 484-79 for the English value. Source: https://wooyangmuseum.org/main
- id 44: official city tourism map identifies Namsangongwon-gil 90-14 instead of source Haksadae-gil. Source: https://www.gc.go.kr/design/culture/file/tourMap_2024.pdf
- id 1447: official park representative address Yeouidong-ro 330 is used instead of source land lot 85. Source: https://hangang.seoul.go.kr/www/contents/669.do?lt=&mid=473
- Source Korean addresses for those four rows were preserved; details and sources are in address-source-differences.csv.
- Clear spelling errors were corrected only in lookup strings: 효령료→효령로, 번기→번길, 조첩읍→조천읍. Their original Korean data was preserved.
- Gangbuk Culture and Arts Center's incomplete trailing '3' was confirmed to mean 3F from the foundation's own address.

## Exception QA and concurrency

- Unknown closure -> NULL. Slash groups and reservation notes retained. First-Monday/month, public-holiday exceptions, winter/summer hours, lunch breaks and last admission verified.
- id 1153 My Art Museum: 10:00-09:00 is ambiguous; open_hours_en remains NULL. Original was not altered.
- dnjf -> Mon based on Korean keyboard typo; official Artlab Sanyang profile confirms Monday closure.
- 11/1 -> Nov 1 supported by Dong-A University's official museum/student guidance.
- A museum was deleted externally during closure review: the initial source-guarded transaction rolled back. Refreshed source data was used; no deleted row recreated.
- id 1393 was deleted externally during address research. The stale transaction rolled back. The final transaction excluded deleted IDs and updated the current 473 rows only.
- Address transaction locked against concurrent writes, checked original address equality, preserved existing nonempty translations, asserted every expected output and every unrequested column, then committed.
- Separate REST readback: 473/473 addresses matched; no NULL address_en; no unrelated column changes.
- Response-loss injection was not performed. Actual source-deletion races were observed and handled. No partial transaction was left applied.

## Artifacts

- address-applied.csv: final addresses and source references.
- address-source-differences.csv: exceptions, corrected lookup strings and official-site differences.
- address-verification.json: final machine-readable readback result.
- translation-review.csv / applied.csv: closure/opening-hour translations from their original backfill stage.
- address-before-initial.json / address-current.json / after-address.json: snapshots.
