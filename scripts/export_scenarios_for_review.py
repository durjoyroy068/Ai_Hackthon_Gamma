#!/usr/bin/env python3
"""Export Mind Gym scenarios to a readable markdown file for expert review."""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MINDGYM = ROOT / "Dataset" / "MindGym"
OUT = MINDGYM / "SCENARIOS_FOR_EXPERT_REVIEW.md"


def main() -> None:
    scenarios_path = MINDGYM / "02_scenario_templates.csv"
    choices_path = MINDGYM / "03_branching_choices.csv"

    with scenarios_path.open(encoding="utf-8-sig", newline="") as f:
        scenarios = list(csv.DictReader(f))

    with choices_path.open(encoding="utf-8-sig", newline="") as f:
        choices = list(csv.DictReader(f))

    by_scenario: dict[str, list[dict]] = defaultdict(list)
    for c in choices:
        by_scenario[c["scenario_id"]].append(c)

    lines = [
        "# Mind Gym — সিনারিও রিভিউ (বিশেষজ্ঞের জন্য)",
        "",
        "> এই ফাইল অটো-জেনারেটেড। `python scripts/export_scenarios_for_review.py` দিয়ে আপডেট করুন।",
        "",
        "---",
        "",
    ]

    for s in scenarios:
        sid = s["scenario_id"]
        lines += [
            f"## {sid}: {s['title_bn']} / {s['title_en']}",
            "",
            f"- **ক্যাটাগরি:** {s['category']}",
            f"- **কঠিনতা:** {s['difficulty']}",
            f"- **ট্যাগ:** {s.get('intake_tags', '')}",
            f"- **সময়:** {s.get('duration_minutes', '')} মিনিট",
            "",
            "### সেটিং (বাংলা)",
            s["setting_description_bn"],
            "",
            "### শুরুর দৃশ্য (বাংলা)",
            s["opening_scene_bn"],
            "",
            "### শুরুর দৃশ্য (English)",
            s["opening_scene_en"],
            "",
            "### চয়েস ও স্কোর",
            "",
        ]
        for c in sorted(by_scenario[sid], key=lambda x: (x["node_id"], x["choice_text_bn"])):
            lines.append(
                f"- **{c['node_id']}** → {c['next_node_id']} | "
                f"BN: {c['choice_text_bn']} | EN: {c['choice_text_en']} | "
                f"score: `{c.get('score_impact', '')}`"
            )
        lines += ["", "---", ""]

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Written: {OUT} ({len(scenarios)} scenarios)")


if __name__ == "__main__":
    main()
