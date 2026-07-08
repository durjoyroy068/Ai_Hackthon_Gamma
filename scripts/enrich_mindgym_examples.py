#!/usr/bin/env python3
"""Append curated Bengali good/bad response examples for Mind Gym scenarios."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "Dataset" / "MindGym" / "05_good_bad_response_examples.csv"

NEW_ROWS = [
    {
        "scenario_id": "SCN_004",
        "situation": "deadline overload 2am",
        "good_response_bn": "আমি উদ্বিগ্ন কিন্তু এক ধাপে ফোকাস করব — ২৫ মিনিট টাইমার দেব",
        "bad_response_bn": "সব ছেড়ে দিচ্ছি আর ঘুমাব",
        "label": "good",
        "why": "task breakdown vs avoidance",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_005",
        "situation": "lonely lunch break",
        "good_response_bn": "আমি একটু নার্ভাস কিন্তু পাশের টেবিলে জয়েন করতে চাই",
        "bad_response_bn": "কেউ আমাকে পছন্দ করে না তাই একা থাকব",
        "label": "good",
        "why": "approach vs negative assumption",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_006",
        "situation": "result day anxiety",
        "good_response_bn": "ফলাফল যাই হোক আমি চেষ্টা করেছি — একটা পরীক্ষা সব নয়",
        "bad_response_bn": "যদি খারাপ হয় তাহলে জীবন শেষ",
        "label": "good",
        "why": "cognitive reframe vs catastrophizing",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_007",
        "situation": "afraid to ask teacher",
        "good_response_bn": "স্যার একটু বুঝিয়ে দিলে ভালো হত — এই অংশটা বুঝিনি",
        "bad_response_bn": "সবাই হাসবে ভেবে চুপ থাকব",
        "label": "good",
        "why": "help seeking vs fear",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_008",
        "situation": "group study pressure",
        "good_response_bn": "আমি একটু পিছিয়ে আছি — কেউ একবার বুঝিয়ে দিতে পারবে?",
        "bad_response_bn": "আমি সবচেয়ে বোকা এখানে",
        "label": "good",
        "why": "honest help seeking vs self attack",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_009",
        "situation": "roommate loud music",
        "good_response_bn": "ভাই কাল পরীক্ষা — একটু কম শব্দ করলে উপকার হত",
        "bad_response_bn": "চিৎকার করে দরজা ধাক্কা দেব",
        "label": "good",
        "why": "assertive vs aggressive",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_010",
        "situation": "campus interview blank mind",
        "good_response_bn": "আমি একটু নার্ভাস — আমার নাম রাহুল আর আমি CSE তে পড়ি",
        "bad_response_bn": "মাথা ফাঁকা আমি পারব না বের হয়ে যাই",
        "label": "good",
        "why": "grounding vs escape",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_001",
        "situation": "exam panic grounding",
        "good_response_bn": "আমার হাত কাঁপছে কিন্তু ৫-৪-৩-২-১ করে শান্ত হওয়ার চেষ্টা করব",
        "bad_response_bn": "পারব না উঠে চলে যাব",
        "label": "good",
        "why": "grounding vs flee",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_003",
        "situation": "friend conflict validation",
        "good_response_bn": "তোর রাগটা বুঝতে পারি — চল একসাথে দেখি কী করা যায়",
        "bad_response_bn": "তুই ভুল তুইই সব শুরু করেছিস",
        "label": "good",
        "why": "empathy vs escalation",
        "source": "curated_clinical",
    },
    {
        "scenario_id": "SCN_002",
        "situation": "presentation nerves",
        "good_response_bn": "আমি একটু নার্ভাস কিন্তু শুরু করছি — আমাদের প্রজেক্টটি হলো...",
        "bad_response_bn": "আমি পারব না মাথা নিচু করে বসে থাকি",
        "label": "good",
        "why": "approach vs avoidance",
        "source": "curated_clinical",
    },
]


def main() -> None:
    existing_keys: set[tuple[str, str]] = set()
    rows: list[dict[str, str]] = []

    if TARGET.exists():
        with TARGET.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or list(NEW_ROWS[0].keys())
            for row in reader:
                rows.append(row)
                existing_keys.add((row.get("scenario_id", ""), row.get("good_response_bn", "")))
    else:
        fieldnames = list(NEW_ROWS[0].keys())

    added = 0
    for item in NEW_ROWS:
        key = (item["scenario_id"], item["good_response_bn"])
        if key in existing_keys:
            continue
        rows.append(item)
        added += 1

    with TARGET.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Added {added} examples. Total rows: {len(rows)}")


if __name__ == "__main__":
    main()
