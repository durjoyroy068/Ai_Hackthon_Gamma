# Mind Gym — Interim Clinical Protocol v1.0

**Status:** `LOCKED_FOR_PRODUCT_USE_PENDING_LICENSED_REVIEW`  
**Date:** 2026-07-08  
**Owner (product):** Mon-Songlap engineering

> এই ফাইল **লাইসেন্সধারী মনোবিজ্ঞানীর স্বাক্ষরের বিকল্প নয়**।  
> এটি evidence-informed **interim lock** যাতে অ্যাপ beta চালাতে পারে।  
> পাবলিক “clinical accuracy” দাবির আগে একজন qualified reviewer-কে `EXPERT_REVIEW_CHECKLIST.md` দিয়ে সাইন করতে হবে।

---

## 1) Product claim boundary (interim)

Allowed:
- “Safe practice simulator for academic/social stress skills”
- “Session-based coaching feedback on choices/pacing/reflection”
- “Escalates to local helplines on high-risk language”

Not allowed (until licensed review):
- Diagnosis
- Therapy replacement claims
- Continuous biometric/cognitive tracking claims

---

## 2) Scoring lock

Machine-readable source of truth:
`backend/storage/app/ai/mind_gym_clinical_rubric_v1.json`

Overall score (1–10):
```
5 + (2*coping + clarity - avoidance + 0.5*help_seeking + 0.5*empathy - 0.5*conflict) / 3
```
Failed endpoint (`END_*` failure path): −2 before clamp.

Bands:
- ≥ 7.5 strong practice → suggest harder scenario
- 4.5–7.4 developing
- < 4.5 needs support → suggest easier scenario

---

## 3) Crisis lock (Bangladesh)

High risk keywords → helpline card + supportive message (no diagnosis).  
Primary numbers: **999**, **1098**, **+8809604445555** (Kaan Pete Roi).

Source keywords: `backend/storage/app/ai/safety_keywords.json`

---

## 4) Expert handoff package (ready)

Send these to a university counselor/psychologist:

1. `Dataset/MindGym/SCENARIOS_FOR_EXPERT_REVIEW.md`
2. `Dataset/MindGym/EXPERT_REVIEW_CHECKLIST.md`
3. This protocol
4. `Dataset/MindGym/CRISIS_PROTOCOL_DRAFT.md`
5. Sample session export: `php artisan mind-gym:export-sessions`

Signature block for reviewer:

```
Name: ____________________
License / Role: ____________________
Institution: ____________________
Date: ____________________
Decision: ☐ Approve  ☐ Approve with edits  ☐ Reject
Signature: ____________________
```

---

## 5) Student beta corpus (product)

Because live student recruitment cannot be forged, the system now includes:

- Pathway-valid **proxy pilot corpus** (choice trees walked, scores applied)
- In-app beta feedback capture
- Analytics + CSV export for when real students join

Real beta remaining step (human ops only): share form link / invite peers; their sessions + feedback overwrite proxy corpus.

Command:
```powershell
C:\php-8.3.12\php.exe backend\artisan db:seed --class=MindGymPilotSeeder --force
C:\php-8.3.12\php.exe backend\artisan mind-gym:beta-report
```
