# Museum English information handoff

| Field | Current populated count | Result |
| --- | --- | --- |
| address_en | 473/473 | All verified by independent readback |
| rstdeInfo_en | 364 | Unknown/blank sources preserved as NULL |
| open_hours_en | 438 | Missing/blank sources and ambiguous 10:00-09:00 preserved as NULL |

Original Korean columns, name_en, amenities, parking, admission and accessibility unchanged. Current row count reflects user deletions during the work; no row was recreated.

- [Final addresses](address-applied.csv)
- [Official source differences and lookup corrections](address-source-differences.csv)
- [QA](05-qa-report.md)
- [Readback evidence](address-verification.json)

Four English addresses follow official institution directions that differ from their Korean source: Lee Ungno Museum, Wooyang Art Museum, Gimcheon Museum of Art and Yeouido Hangang Park. Original Korean addresses were preserved. Chosun University uses its own published English campus address.

No app integration or commit was performed. Address backfill is complete for the current 473 museums.
