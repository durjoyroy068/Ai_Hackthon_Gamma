"""
Download public mental-health datasets + generate Mind Gym CSV files.
Output: Dataset/MindGym/
"""
from __future__ import annotations

import json
import re
import shutil
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Dataset" / "MindGym"
EXISTING = ROOT / "Dataset"

HF_URLS = {
    "mental_health_counseling.csv": (
        "https://huggingface.co/datasets/Amod/mental_health_counseling_conversations/"
        "resolve/main/counsel_chatbot_dataset.csv"
    ),
    "student_mental_health_counseling.csv": (
        "https://huggingface.co/datasets/arafatanam/Student-Mental-Health-Counseling-EN/"
        "resolve/main/data/train-00000-of-00001.parquet"
    ),
    "empathetic_dialogues_train.csv": (
        "https://huggingface.co/datasets/empathetic_dialogues/resolve/main/empatheticdialogues/train.csv"
    ),
}

# Fallback direct CSV if parquet fails
HF_CSV_FALLBACKS = {
    "counseling_pretrain_train.csv": (
        "https://huggingface.co/datasets/Felladrin/pretrain-mental-health-counseling-conversations/"
        "resolve/main/train.csv"
    ),
}


def download_file(url: str, dest: Path) -> bool:
    try:
        print(f"  Downloading {dest.name} ...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mon-Songlap/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            dest.write_bytes(resp.read())
        print(f"  OK ({dest.stat().st_size // 1024} KB)")
        return True
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False


def load_hf_parquet_as_csv(parquet_path: Path, csv_path: Path) -> bool:
    try:
        df = pd.read_parquet(parquet_path)
        df.to_csv(csv_path, index=False)
        parquet_path.unlink(missing_ok=True)
        return True
    except Exception as exc:
        print(f"  Parquet convert failed: {exc}")
        return False


def download_public_datasets() -> dict:
    raw_dir = OUT / "downloaded"
    raw_dir.mkdir(parents=True, exist_ok=True)
    results = {}

    for name, url in HF_URLS.items():
        dest = raw_dir / name
        if name.endswith(".parquet"):
            dest = raw_dir / name
            ok = download_file(url, dest)
            if ok:
                csv_dest = raw_dir / name.replace(".parquet", ".csv")
                ok = load_hf_parquet_as_csv(dest, csv_dest)
                results[name] = "ok" if ok else "parquet_fail"
            else:
                results[name] = "fail"
        else:
            ok = download_file(url, dest)
            results[name] = "ok" if ok else "fail"

    for name, url in HF_CSV_FALLBACKS.items():
        dest = raw_dir / name
        if not dest.exists():
            ok = download_file(url, dest)
            results[name] = "ok" if ok else "fail"

    return results


def build_intake_dataset() -> Path:
    """Derive intake profiles from existing Bangladesh student surveys."""
    proc = pd.read_csv(EXISTING / "Processed.csv")
    rows = []
    for i, r in proc.iterrows():
        anxiety = str(r.get("Anxiety Label", ""))
        depression = str(r.get("Depression Label", ""))
        stress = str(r.get("Stress Label", ""))

        if "Severe" in anxiety or "Severe" in stress:
            severity = 8
        elif "Moderate" in anxiety or "Moderate" in stress or "Moderate" in depression:
            severity = 6
        elif "Mild" in anxiety or "Mild" in stress or "Mild" in depression:
            severity = 4
        else:
            severity = 2

        if "Anxiety" in anxiety and float(r.get("Anxiety Value", 0) or 0) >= float(r.get("Stress Value", 0) or 0):
            stress_type = "anxiety"
            main_trigger = "exam_panic" if severity >= 6 else "academic_worry"
        elif "Stress" in stress:
            stress_type = "academic_stress"
            main_trigger = "deadline_overload"
        elif "Depression" in depression:
            stress_type = "depression"
            main_trigger = "low_motivation"
        else:
            stress_type = "general"
            main_trigger = "academic_worry"

        rows.append(
            {
                "user_id": f"U{i+1:04d}",
                "age_band": r.get("Age", "18-22"),
                "gender": r.get("Gender", ""),
                "university": r.get("University", ""),
                "department": r.get("Department", ""),
                "academic_year": r.get("Academic_Year", ""),
                "stress_type": stress_type,
                "main_trigger": main_trigger,
                "severity_1_10": severity,
                "anxiety_label": anxiety,
                "depression_label": depression,
                "stress_label": stress,
                "language": "bn",
                "source": "processed_survey",
            }
        )

    path = OUT / "01_intake_profiles.csv"
    pd.DataFrame(rows).to_csv(path, index=False)
    return path


def build_scenario_templates() -> Path:
    scenarios = [
        {
            "scenario_id": "SCN_001",
            "title_bn": "পরীক্ষার হলে প্যানিক",
            "title_en": "Exam Hall Panic",
            "category": "exam",
            "difficulty": "medium",
            "intake_tags": "academic_stress,exam_panic,anxiety",
            "setting_description_bn": "বড় পরীক্ষার হল। ঘড়ি টিকটিক করছে। সবাই লিখছে। তোমার হাত কাঁপছে।",
            "setting_description_en": "Large exam hall. Clock ticking. Everyone writing. Your hands are shaking.",
            "opening_scene_bn": "প্রশ্নপত্র হাতে পেয়েছ। প্রথম প্রশ্নটা পড়লে মনে হচ্ছে মাথা ফাঁকা।",
            "opening_scene_en": "You received the paper. Reading Q1, your mind goes blank.",
            "npc_roles": "invigilator,classmate",
            "duration_minutes": 8,
        },
        {
            "scenario_id": "SCN_002",
            "title_bn": "ক্লাস প্রেজেন্টেশন",
            "title_en": "Class Presentation",
            "category": "presentation",
            "difficulty": "medium",
            "intake_tags": "social_anxiety,academic_stress",
            "setting_description_bn": "ক্লাসরুম। ৪০ জন বন্ধু দেখছে। স্লাইড প্রজেক্টরে।",
            "setting_description_en": "Classroom. 40 classmates watching. Slide on projector.",
            "opening_scene_bn": "তোমার নাম ধরা হয়েছে। মাইক্রোফোনের দিকে যেতে হবে।",
            "opening_scene_en": "Your name is called. You must walk to the mic.",
            "npc_roles": "teacher,classmates",
            "duration_minutes": 10,
        },
        {
            "scenario_id": "SCN_003",
            "title_bn": "বন্ধুর সাথে মতবিরোধ",
            "title_en": "Conflict with Friend",
            "category": "conflict",
            "difficulty": "easy",
            "intake_tags": "social_anxiety,relationship_stress",
            "setting_description_bn": "ক্যাম্পাস ক্যাফে। বন্ধু রাগী। গ্রুপ প্রজেক্ট নিয়ে ঝগড়া।",
            "setting_description_en": "Campus cafe. Angry friend. Argument over group project.",
            "opening_scene_bn": "বন্ধু বলে: 'তুই কিছুই করিসনি, সব আমার উপর চাপিয়ে দিছিস।'",
            "opening_scene_en": "Friend says: 'You did nothing and pushed it all on me.'",
            "npc_roles": "friend",
            "duration_minutes": 7,
        },
        {
            "scenario_id": "SCN_004",
            "title_bn": "অ্যাসাইনমেন্ট ডেডলাইন ক্রাইসিস",
            "title_en": "Assignment Deadline Crisis",
            "category": "academic_stress",
            "difficulty": "hard",
            "intake_tags": "academic_stress,deadline_overload",
            "setting_description_bn": "রাত ২টা। কাল সাবমিট। ল্যাপটপে অarter কাজ বাকি।",
            "setting_description_en": "2 AM. Due tomorrow. Half the work left on laptop.",
            "opening_scene_bn": "মনে হচ্ছে সব একসাথে পড়ে আছে। চোখে ঘুম নেই।",
            "opening_scene_en": "Everything feels piled up. No sleep.",
            "npc_roles": "inner_voice,roommate",
            "duration_minutes": 8,
        },
        {
            "scenario_id": "SCN_005",
            "title_bn": "নতুন পরিবেশে একা লাগা",
            "title_en": "Feeling Alone in New Environment",
            "category": "social",
            "difficulty": "easy",
            "intake_tags": "loneliness,social_anxiety",
            "setting_description_bn": "নতুন সেমিস্টার। সবাই গ্রুপে আড্ডা দিচ্ছে। তুমি একা বসে আছ।",
            "setting_description_en": "New semester. Everyone in groups. You sit alone.",
            "opening_scene_bn": "লাঞ্চ ব্রেকে কাউকে জিজ্ঞেস করতে ইচ্ছে করছে না।",
            "opening_scene_en": "At lunch you want to ask someone but can't.",
            "npc_roles": "classmate_group",
            "duration_minutes": 6,
        },
        {
            "scenario_id": "SCN_006",
            "title_bn": "রিজাল্টের আগে উদ্বেগ",
            "title_en": "Result Day Anxiety",
            "category": "exam",
            "difficulty": "medium",
            "intake_tags": "exam_panic,academic_stress",
            "setting_description_bn": "রিজাল্ট আজ। ফোনে বারবার চেক করছ।",
            "setting_description_en": "Results today. Checking phone repeatedly.",
            "opening_scene_bn": "মনে হচ্ছে বাবা-মা হতাশ হবে যদি খারাপ হয়।",
            "opening_scene_en": "You fear disappointing parents if grades are bad.",
            "npc_roles": "parent_voice,inner_voice",
            "duration_minutes": 7,
        },
        {
            "scenario_id": "SCN_007",
            "title_bn": "টিচারের সামনে প্রশ্ন করতে ভয়",
            "title_en": "Afraid to Ask Teacher",
            "category": "social",
            "difficulty": "easy",
            "intake_tags": "social_anxiety,academic_stress",
            "setting_description_bn": "ক্লাস শেষ। টিচার চলে যাচ্ছেন। টপিকটা বুঝোনি।",
            "setting_description_en": "Class ending. Teacher leaving. You didn't understand.",
            "opening_scene_bn": "হাত তুলতে পারছ না — সবাই কী ভাববে?",
            "opening_scene_en": "You can't raise your hand — what will others think?",
            "npc_roles": "teacher,classmates",
            "duration_minutes": 5,
        },
        {
            "scenario_id": "SCN_008",
            "title_bn": "গ্রুপ স্টাডিতে চাপ",
            "title_en": "Group Study Pressure",
            "category": "social",
            "difficulty": "medium",
            "intake_tags": "social_anxiety,academic_stress",
            "setting_description_bn": "গ্রুপ স্টাডি। সবাই তোমার চেয়ে এগিয়ে।",
            "setting_description_en": "Group study. Everyone seems ahead of you.",
            "opening_scene_bn": "মনে হচ্ছে তুমি সবচেয়ে কম জানো।",
            "opening_scene_en": "You feel like you know the least.",
            "npc_roles": "study_group",
            "duration_minutes": 8,
        },
        {
            "scenario_id": "SCN_009",
            "title_bn": "রুমমেটের সাথে টেনশন",
            "title_en": "Roommate Tension",
            "category": "conflict",
            "difficulty": "medium",
            "intake_tags": "relationship_stress,academic_stress",
            "setting_description_bn": "হোস্টেল রুম। রুমমেট জোরে গান বাজাচ্ছে, পরীক্ষা কাল।",
            "setting_description_en": "Hostel room. Roommate plays loud music, exam tomorrow.",
            "opening_scene_bn": "বলতে ইচ্ছে করছে কিন্তু ঝগড়া হবে ভেবে থামছ।",
            "opening_scene_en": "You want to speak up but fear conflict.",
            "npc_roles": "roommate",
            "duration_minutes": 6,
        },
        {
            "scenario_id": "SCN_010",
            "title_bn": "ক্যাম্পাস ইন্টারভিউ",
            "title_en": "Campus Job Interview",
            "category": "presentation",
            "difficulty": "hard",
            "intake_tags": "social_anxiety,exam_panic",
            "setting_description_bn": "ছোট ইন্টারভিউ রুম। দুজন ইন্টারভিউয়ার।",
            "setting_description_en": "Small interview room. Two interviewers.",
            "opening_scene_bn": "'Tell us about yourself' — মাথা ফাঁকা।",
            "opening_scene_en": "'Tell us about yourself' — mind goes blank.",
            "npc_roles": "interviewer",
            "duration_minutes": 10,
        },
    ]
    path = OUT / "02_scenario_templates.csv"
    pd.DataFrame(scenarios).to_csv(path, index=False)
    return path


def build_branching_choices() -> Path:
  branches = []
  branch_defs = {
    "SCN_001": [
      ("N1", "গভীর শ্বাস নিই এবং এক প্রশ্নে ফোকাস করি", "N2", "coping:+2,avoidance:0", 0),
      ("N1", "প্রশ্নপত্র ফেলে দিতে ইচ্ছে করে", "N3", "coping:0,avoidance:+3", 1),
      ("N1", "হাত তুলে ইনভিজিলেটরকে বলি পানি লাগবে", "N2", "coping:+1,help_seeking:+2", 0),
      ("N2", "ধীরে প্রথম উত্তর লিখতে শুরু করি", "N4", "coping:+2,clarity:+1", 0),
      ("N2", "প্যানিক বাড়ে, হাত কাঁপতে থাকে", "N5", "coping:0,avoidance:+1", 0),
      ("N3", "বের হয়ে যাই", "END_FAIL", "coping:0,avoidance:+5", 2),
      ("N4", "শান্ত হয়ে বাকি পরীক্ষা দিই", "END_OK", "coping:+3,clarity:+2", -1),
      ("N5", "৫-৪-৩-২-১ grounding করি", "N4", "coping:+3,clarity:+1", -1),
    ],
    "SCN_002": [
      ("N1", "একটা গভীর শ্বাস নিয়ে শুরু করি", "N2", "coping:+2,clarity:+1", 0),
      ("N1", "অসুস্থ বলে বের হয়ে যাই", "END_FAIL", "avoidance:+4", 1),
      ("N1", "টিচারকে বলি এক মিনিট সময় চাই", "N2", "help_seeking:+2,coping:+1", 0),
      ("N2", "চোখের contact রেখে প্রথম লাইন বলি", "END_OK", "coping:+3,clarity:+2", -1),
    ],
    "SCN_003": [
      ("N1", "শান্তভাবে শুনি, তার অনুভূতি স্বীকার করি", "N2", "coping:+2,empathy:+2", 0),
      ("N1", "তার উপর দোষ চাপাই", "END_FAIL", "avoidance:+2,conflict:+3", 1),
      ("N1", "চুপ থাকি, কিছু বলি না", "N3", "avoidance:+3", 0),
      ("N2", "সমাধানের জন্য একটা পদক্ষেপ প্রস্তাব করি", "END_OK", "coping:+3,clarity:+2", -1),
      ("N3", "পরে শান্ত সময়ে কথা বলার প্রস্তাব দিই", "END_OK", "coping:+1,help_seeking:+1", 0),
    ],
  }
  for sid, items in branch_defs.items():
    for node, choice, next_node, impact, diff in items:
      branches.append(
        {
          "scenario_id": sid,
          "node_id": node,
          "choice_text_bn": choice,
          "choice_text_en": choice,
          "next_node_id": next_node,
          "score_impact": impact,
          "difficulty_delta": diff,
        }
      )
  # Fill remaining scenarios with generic branches
  for sid in [f"SCN_{i:03d}" for i in range(4, 11)]:
    for node, choice, nxt, imp, diff in [
      ("N1", "একটা ছোট coping step নিই", "N2", "coping:+2", 0),
      ("N1", "এড়িয়ে যাই", "END_FAIL", "avoidance:+4", 1),
      ("N2", "কাউকে সাহায্য চাই", "END_OK", "help_seeking:+3,coping:+2", -1),
      ("N2", "নিজে handle করার চেষ্টা করি", "END_OK", "coping:+2,clarity:+1", 0),
    ]:
      branches.append(
        {
          "scenario_id": sid,
          "node_id": node,
          "choice_text_bn": choice,
          "choice_text_en": choice,
          "next_node_id": nxt,
          "score_impact": imp,
          "difficulty_delta": diff,
        }
      )

  path = OUT / "03_branching_choices.csv"
  pd.DataFrame(branches).to_csv(path, index=False)
  return path


def build_good_bad_examples(raw_dir: Path) -> Path:
    """Build from counseling downloads + manual seeds."""
    rows = []
    seeds = [
      ("SCN_001", "exam panic, mind blank", "আমি নার্ভাস, কিন্তু এক প্রশ্নে ফোকাস করার চেষ্টা করব", "আমি পারব না, চলে যাই", "good", "coping vs avoidance"),
      ("SCN_002", "presentation fear", "একটা শ্বাস নিয়ে শুরু করি", "মাথা নিচু করে চুপ থাকি", "good", "engagement vs avoidance"),
      ("SCN_003", "friend conflict", "তোর কষ্টটা বুঝতে পারছি, আলাপ করে সমাধান করি", "তুই নিজেই ভুল, আমার দোষ নেই", "bad", "blame escalates conflict"),
      ("SCN_004", "deadline stress", "একটা task লিস্ট বানিয়ে প্রায়োরিটি দিই", "সব ছেড়ে দিই, ঘুমাই", "good", "planning vs shutdown"),
      ("SCN_005", "loneliness", "একজনকে হাই বলার চেষ্টা করি", "আর কাউকে কাছে যাব না", "good", "approach vs withdrawal"),
    ]
    for s in seeds:
      rows.append(
        {
          "scenario_id": s[0],
          "situation": s[1],
          "good_response_bn": s[2] if s[4] == "good" else s[3],
            "bad_response_bn": s[3] if s[4] == "good" else s[2],
            "label": s[4],
            "why": s[5],
            "source": "manual_seed",
        }
    )

    counsel_path = raw_dir / "mental_health_counseling.csv"
    if counsel_path.exists():
        cdf = pd.read_csv(counsel_path)
        cols = cdf.columns.tolist()
        ctx_col = next((c for c in cols if "context" in c.lower() or "question" in c.lower()), cols[0])
        resp_col = next((c for c in cols if "response" in c.lower() or "answer" in c.lower()), cols[-1])
        for _, r in cdf.head(300).iterrows():
            q = str(r.get(ctx_col, ""))[:200]
            a = str(r.get(resp_col, ""))[:300]
            if len(q) < 20 or len(a) < 20:
                continue
            cat = "SCN_004" if "stress" in q.lower() or "anx" in q.lower() else "SCN_001"
            rows.append(
                {
                    "scenario_id": cat,
                    "situation": q,
                    "good_response_bn": a,
                    "bad_response_bn": "Just ignore it and push through alone without telling anyone.",
                    "label": "good",
                    "why": "empathetic professional response",
                    "source": "Amod_counseling",
                }
            )

    combined = pd.read_csv(EXISTING / "Combined Data.csv")
    for status in ["Anxiety", "Stress", "Depression", "Suicidal"]:
      sub = combined[combined["status"] == status].sample(min(50, (combined["status"] == status).sum()), random_state=42)
      sid = {"Anxiety": "SCN_001", "Stress": "SCN_004", "Depression": "SCN_005", "Suicidal": "SCN_001"}[status]
      for _, r in sub.iterrows():
        stmt = str(r["statement"])[:200]
        rows.append(
          {
            "scenario_id": sid,
            "situation": stmt,
            "good_response_bn": "I hear you. Your feelings are valid. Would you like to try one small step together?",
            "bad_response_bn": "Stop overthinking. Others have it worse.",
            "label": "good",
            "why": "validation vs dismissive",
            "source": "combined_data",
          }
        )

    path = OUT / "05_good_bad_response_examples.csv"
    pd.DataFrame(rows).to_csv(path, index=False)
    return path


def build_session_scores() -> Path:
    """Synthetic demo sessions for scoring rubric development."""
    import random

    random.seed(42)
    rows = []
    scenarios = [f"SCN_{i:03d}" for i in range(1, 11)]
    coping_phrases = [
      "deep breath", "ask for help", "break into steps", "talk to friend", "grounding",
      "গভীর শ্বাস", "সাহায্য চাই", "একটা কাজ করি",
    ]
    avoid_phrases = ["quit", "run away", "can't do", "give up", "এড়িয়ে", "পারব না"]

    for i in range(500):
      sid = random.choice(scenarios)
      resp = random.choice(coping_phrases + avoid_phrases + ["okay let me try", "I feel nervous"])
      is_coping = any(p in resp.lower() for p in ["breath", "help", "step", "try", "শ্বাস", "সাহায্য", "করি"])
      coping = random.randint(3, 5) if is_coping else random.randint(1, 3)
      avoidance = random.randint(1, 2) if is_coping else random.randint(3, 5)
      clarity = random.randint(2, 5)
      overall = round((coping * 2 + clarity - avoidance) / 3, 1)
      overall = max(1, min(10, overall))
      rows.append(
        {
          "session_id": f"S{i+1:04d}",
          "user_id": f"U{random.randint(1,500):04d}",
          "scenario_id": sid,
          "difficulty_level": random.choice(["easy", "medium", "hard"]),
          "user_response": resp,
          "response_time_sec": random.randint(3, 45),
          "choice_made": random.choice(["cope", "avoid", "help_seek", "engage"]),
          "clarity_score": clarity,
          "coping_score": coping,
          "avoidance_score": avoidance,
          "overall_score": overall,
          "feedback_text": "Good coping attempt." if overall >= 6 else "Try naming your feeling and one small next step.",
          "source": "synthetic_demo",
        }
      )

    path = OUT / "04_response_session_scores.csv"
    pd.DataFrame(rows).to_csv(path, index=False)
    return path


def build_skill_tree() -> Path:
    import random

    random.seed(7)
    categories = ["exam_stress", "social_anxiety", "academic_stress", "conflict", "presentation"]
    rows = []
    for i in range(200):
      cat = random.choice(categories)
      lvl = random.randint(1, 5)
      rows.append(
        {
          "user_id": f"U{i+1:04d}",
          "category": cat,
          "current_level": lvl,
          "xp": lvl * 100 + random.randint(0, 99),
          "sessions_completed": random.randint(1, 20),
          "avg_score": round(random.uniform(4, 9), 1),
          "unlocked_scenarios": ",".join([f"SCN_{random.randint(1,10):03d}" for _ in range(lvl)]),
          "last_difficulty": random.choice(["easy", "medium", "hard"]),
          "source": "synthetic_demo",
        }
      )
    path = OUT / "06_skill_tree_progress.csv"
    pd.DataFrame(rows).to_csv(path, index=False)
    return path


def write_readme(download_results: dict, files: list[Path]) -> None:
    readme = OUT / "README.md"
    lines = [
        "# Mind Gym Datasets",
        "",
        "## Generated for Mon-Songlap Mind Gym",
        "",
        "### Core Mind Gym files (use these first)",
        "| File | Rows purpose |",
        "|------|--------------|",
        "| `01_intake_profiles.csv` | User stress profiles (from your Processed survey) |",
        "| `02_scenario_templates.csv` | 10 practice scenarios (BN+EN) |",
        "| `03_branching_choices.csv` | Choice trees per scenario |",
        "| `04_response_session_scores.csv` | Demo session scores (500 rows) |",
        "| `05_good_bad_response_examples.csv` | Good vs bad responses for AI feedback |",
        "| `06_skill_tree_progress.csv` | Demo skill tree state |",
        "",
        "### Downloaded public datasets (`downloaded/`)",
        "",
    ]
    for k, v in download_results.items():
        lines.append(f"- `{k}`: {v}")
    lines += [
        "",
        "### Original datasets (parent folder)",
        "Your 8 original CSV files remain in `Dataset/` — still used for chat AI training.",
        "",
        "### Note",
        "Session scores & skill tree are **demo/synthetic** until real users practice in the app.",
        "Replace with real logs from Mon-Songlap beta.",
    ]
    readme.write_text("\n".join(lines), encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("=== Downloading public datasets ===")
    dl_results = download_public_datasets()

    print("\n=== Building Mind Gym datasets ===")
    files = [
        build_intake_dataset(),
        build_scenario_templates(),
        build_branching_choices(),
        build_session_scores(),
        build_good_bad_examples(OUT / "downloaded"),
        build_skill_tree(),
    ]
    for f in files:
        df = pd.read_csv(f)
        print(f"  {f.name}: {len(df)} rows")

    write_readme(dl_results, files)
    print(f"\nDone. Output: {OUT}")


if __name__ == "__main__":
    main()
