from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta
from pathlib import Path

import openpyxl


PROJECT_DIR = Path(__file__).resolve().parents[1]
SOURCE = PROJECT_DIR.parent / "outputs" / "Ракова_Арина_статистика_плавание.xlsx"
DESTINATION = PROJECT_DIR / "static" / "swimming-results.json"


def iso_date(value: object) -> str:
    if isinstance(value, (datetime, date)):
        return value.date().isoformat() if isinstance(value, datetime) else value.isoformat()
    return str(value)


def seconds(value: object) -> float:
    if isinstance(value, timedelta):
        return round(value.total_seconds(), 2)
    if isinstance(value, time):
        return round(value.hour * 3600 + value.minute * 60 + value.second + value.microsecond / 1_000_000, 2)
    raise ValueError(f"Unsupported time value: {value!r}")


def display_time(value: float) -> str:
    minutes = int(value // 60)
    rest = value - minutes * 60
    return f"{minutes}:{rest:05.2f}" if minutes else f"{rest:.2f}"


workbook = openpyxl.load_workbook(SOURCE, data_only=True, read_only=True)
sheet = workbook["Результаты"]
rows = sheet.iter_rows(values_only=True)
headers = next(rows)

results = []
for row in rows:
    record = dict(zip(headers, row))
    if record["№"] is None:
        continue
    time_seconds = seconds(record["Результат"])
    results.append(
        {
            "id": int(record["№"]),
            "startDate": iso_date(record["Дата начала"]),
            "endDate": iso_date(record["Дата окончания"]),
            "city": str(record["Город"]),
            "competition": str(record["Соревнование"]),
            "poolLength": int(record["Бассейн, м"]),
            "stroke": str(record["Стиль"]),
            "distance": int(record["Дистанция, м"]),
            "time": display_time(time_seconds),
            "timeSeconds": time_seconds,
            "rank": str(record["Расчётный разряд"] or ""),
            "sourceType": str(record["Тип источника"] or ""),
            "sourceUrl": str(record["Источник"] or ""),
        }
    )

payload = {
    "athlete": {
        "name": "Арина Ракова",
        "birthDate": "2014-05-16",
        "city": "Томск",
        "sport": "Спортивное плавание",
    },
    "generatedAt": "2026-10-07",
    "sourceWorkbook": SOURCE.name,
    "results": results,
}

DESTINATION.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Exported {len(results)} results to {DESTINATION}")
