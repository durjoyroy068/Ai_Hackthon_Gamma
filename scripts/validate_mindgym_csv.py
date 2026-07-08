#!/usr/bin/env python3
"""Validate Mind Gym CSV files before seeding the database."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MINDGYM = ROOT / "Dataset" / "MindGym"

REQUIRED_SCENARIOS = {
    "scenario_id",
    "title_bn",
    "title_en",
    "category",
    "difficulty",
    "setting_description_bn",
    "setting_description_en",
    "opening_scene_bn",
    "opening_scene_en",
}

REQUIRED_CHOICES = {
    "scenario_id",
    "node_id",
    "choice_text_bn",
    "choice_text_en",
    "next_node_id",
    "score_impact",
}

VALID_DIFFICULTIES = {"easy", "medium", "hard"}
SCORE_KEYS = {"coping", "avoidance", "clarity", "help_seeking", "empathy", "conflict"}


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = [row for row in reader]
    return list(headers), rows


def validate_scenarios() -> list[str]:
    path = MINDGYM / "02_scenario_templates.csv"
    errors: list[str] = []
    if not path.exists():
        return [f"Missing {path}"]

    headers, rows = read_csv(path)
    missing = REQUIRED_SCENARIOS - set(headers)
    if missing:
        errors.append(f"02: missing columns: {sorted(missing)}")

    ids = set()
    for i, row in enumerate(rows, start=2):
        sid = row.get("scenario_id", "").strip()
        if not sid:
            errors.append(f"02 row {i}: empty scenario_id")
            continue
        if sid in ids:
            errors.append(f"02 row {i}: duplicate scenario_id {sid}")
        ids.add(sid)
        if row.get("difficulty", "").strip() not in VALID_DIFFICULTIES:
            errors.append(f"02 row {i} ({sid}): invalid difficulty")
        for col in ("title_bn", "opening_scene_bn"):
            if not row.get(col, "").strip():
                errors.append(f"02 row {i} ({sid}): empty {col}")

    print(f"OK 02_scenario_templates.csv - {len(rows)} scenarios")
    return errors


def parse_score_impact(raw: str) -> dict[str, int]:
    impact: dict[str, int] = {}
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        if ":" in part:
            key, val = part.split(":", 1)
            impact[key.strip()] = int(val.strip().replace("+", ""))
        elif "+" in part:
            key, val = part.split("+", 1)
            impact[key.strip()] = int(val.strip())
    return impact


def validate_choices() -> list[str]:
    path = MINDGYM / "03_branching_choices.csv"
    errors: list[str] = []
    if not path.exists():
        return [f"Missing {path}"]

    scenario_path = MINDGYM / "02_scenario_templates.csv"
    _, scenario_rows = read_csv(scenario_path)
    valid_scenario_ids = {r["scenario_id"].strip() for r in scenario_rows}

    headers, rows = read_csv(path)
    missing = REQUIRED_CHOICES - set(headers)
    if missing:
        errors.append(f"03: missing columns: {sorted(missing)}")

    for i, row in enumerate(rows, start=2):
        sid = row.get("scenario_id", "").strip()
        if sid not in valid_scenario_ids:
            errors.append(f"03 row {i}: unknown scenario_id {sid}")
        if not row.get("node_id", "").strip():
            errors.append(f"03 row {i}: empty node_id")
        if not row.get("next_node_id", "").strip():
            errors.append(f"03 row {i}: empty next_node_id")
        try:
            impact = parse_score_impact(row.get("score_impact", ""))
            unknown = set(impact) - SCORE_KEYS
            if unknown:
                errors.append(f"03 row {i}: unknown score keys {unknown}")
        except ValueError as e:
            errors.append(f"03 row {i}: bad score_impact — {e}")

    print(f"OK 03_branching_choices.csv - {len(rows)} choices")
    return errors


def main() -> int:
    print("Mind Gym CSV Validation\n" + "=" * 40)
    errors = validate_scenarios() + validate_choices()

    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("\nAll checks passed. Safe to run MindGymSeeder.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
