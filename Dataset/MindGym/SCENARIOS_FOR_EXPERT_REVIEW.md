# Mind Gym — সিনারিও রিভিউ (বিশেষজ্ঞের জন্য)

> এই ফাইল অটো-জেনারেটেড। `python scripts/export_scenarios_for_review.py` দিয়ে আপডেট করুন।

---

## SCN_001: পরীক্ষার হলে প্যানিক / Exam Hall Panic

- **ক্যাটাগরি:** exam
- **কঠিনতা:** medium
- **ট্যাগ:** academic_stress,exam_panic,anxiety
- **সময়:** 8 মিনিট

### সেটিং (বাংলা)
বড় পরীক্ষার হল। ঘড়ি টিকটিক করছে। সবাই লিখছে। তোমার হাত কাঁপছে।

### শুরুর দৃশ্য (বাংলা)
প্রশ্নপত্র হাতে পেয়েছ। প্রথম প্রশ্নটা পড়লে মনে হচ্ছে মাথা ফাঁকা।

### শুরুর দৃশ্য (English)
You received the paper. Reading Q1, your mind goes blank.

### চয়েস ও স্কোর

- **N1** → N2 | BN: গভীর শ্বাস নিই এবং এক প্রশ্নে ফোকাস করি | EN: Take a deep breath and focus on one question | score: `coping:+2,clarity:+1`
- **N1** → N3 | BN: প্রশ্নপত্র ফেলে দিতে ইচ্ছে করে | EN: I want to leave the exam hall | score: `coping:0,avoidance:+3`
- **N1** → N2 | BN: হাত তুলে ইনভিজিলেটরকে বলি পানি লাগবে | EN: Ask the invigilator for water | score: `coping:+1,help_seeking:+2`
- **N2** → N4 | BN: ধীরে প্রথম উত্তর লিখতে শুরু করি | EN: Slowly start writing the first answer | score: `coping:+2,clarity:+1`
- **N2** → N5 | BN: প্যানিক বাড়ে, হাত কাঁপতে থাকে | EN: Panic grows and my hands keep shaking | score: `coping:0,avoidance:+1`
- **N3** → END_FAIL | BN: বের হয়ে যাই | EN: Leave the exam hall | score: `coping:0,avoidance:+5`
- **N4** → END_OK | BN: শান্ত হয়ে বাকি পরীক্ষা দিই | EN: Stay calm and finish the exam | score: `coping:+3,clarity:+2`
- **N5** → N4 | BN: ৫-৪-৩-২-১ গ্রাউন্ডিং অনুশীলন করি | EN: Do 5-4-3-2-1 grounding exercise | score: `coping:+3,clarity:+1`

---

## SCN_002: ক্লাস প্রেজেন্টেশন / Class Presentation

- **ক্যাটাগরি:** presentation
- **কঠিনতা:** medium
- **ট্যাগ:** social_anxiety,academic_stress
- **সময়:** 10 মিনিট

### সেটিং (বাংলা)
ক্লাসরুম। ৪০ জন বন্ধু দেখছে। স্লাইড প্রজেক্টরে।

### শুরুর দৃশ্য (বাংলা)
তোমার নাম ধরা হয়েছে। মাইক্রোফোনের দিকে যেতে হবে।

### শুরুর দৃশ্য (English)
Your name is called. You must walk to the mic.

### চয়েস ও স্কোর

- **N1** → END_FAIL | BN: অসুস্থ বলে বের হয়ে যাই | EN: Say I'm sick and leave | score: `avoidance:+4`
- **N1** → N2 | BN: একটা গভীর শ্বাস নিয়ে শুরু করি | EN: Take a deep breath and begin | score: `coping:+2,clarity:+1`
- **N1** → N2 | BN: টিচারকে বলি এক মিনিট সময় চাই | EN: Ask the teacher for one minute | score: `help_seeking:+2,coping:+1`
- **N2** → END_OK | BN: চোখের দৃষ্টি রেখে প্রথম লাইন বলি | EN: Say the first line while making eye contact | score: `coping:+3,clarity:+2`

---

## SCN_003: বন্ধুর সাথে মতবিরোধ / Conflict with Friend

- **ক্যাটাগরি:** conflict
- **কঠিনতা:** easy
- **ট্যাগ:** social_anxiety,relationship_stress
- **সময়:** 7 মিনিট

### সেটিং (বাংলা)
ক্যাম্পাস ক্যাফে। বন্ধু রাগী। গ্রুপ প্রজেক্ট নিয়ে ঝগড়া।

### শুরুর দৃশ্য (বাংলা)
বন্ধু বলে: 'তুই কিছুই করিসনি, সব আমার উপর চাপিয়ে দিছিস।'

### শুরুর দৃশ্য (English)
Friend says: 'You did nothing and pushed it all on me.'

### চয়েস ও স্কোর

- **N1** → N3 | BN: চুপ থাকি, কিছু বলি না | EN: Stay silent and say nothing | score: `avoidance:+3`
- **N1** → END_FAIL | BN: তার উপর দোষ চাপাই | EN: Blame them back | score: `avoidance:+2,conflict:+3`
- **N1** → N2 | BN: শান্তভাবে শুনি, তার অনুভূতি স্বীকার করি | EN: Listen calmly and acknowledge their feelings | score: `coping:+2,empathy:+2`
- **N2** → END_OK | BN: সমাধানের জন্য একটা পদক্ষেপ প্রস্তাব করি | EN: Propose one step toward a solution | score: `coping:+3,clarity:+2`
- **N3** → END_OK | BN: পরে শান্ত সময়ে কথা বলার প্রস্তাব দিই | EN: Suggest talking again when we're calmer | score: `coping:+1,help_seeking:+1`

---

## SCN_004: অ্যাসাইনমেন্ট ডেডলাইন ক্রাইসিস / Assignment Deadline Crisis

- **ক্যাটাগরি:** academic_stress
- **কঠিনতা:** hard
- **ট্যাগ:** academic_stress,deadline_overload
- **সময়:** 8 মিনিট

### সেটিং (বাংলা)
রাত ২টা। কাল সাবমিট। ল্যাপটপে অর্ধেক কাজ বাকি।

### শুরুর দৃশ্য (বাংলা)
মনে হচ্ছে সব একসাথে পড়ে আছে। চোখে ঘুম নেই।

### শুরুর দৃশ্য (English)
Everything feels piled up. No sleep.

### চয়েস ও স্কোর

- **N1** → N2 | BN: কাজটা তিনটা ছোট ধাপে ভাগ করি | EN: Break the work into three small steps | score: `coping:+2,clarity:+2`
- **N1** → N2 | BN: রুমমেটকে বলি একটু সাহায্য চাই | EN: Ask my roommate for a little help | score: `help_seeking:+2,coping:+1`
- **N1** → END_FAIL | BN: ল্যাপটপ বন্ধ করে ঘুমিয়ে পড়ি | EN: Shut the laptop and go to sleep | score: `avoidance:+4,coping:0`
- **N2** → N4 | BN: সোশ্যাল মিডিয়ায় ঘুরি — মন ঘুরিয়ে দিই | EN: Scroll social media to distract myself | score: `avoidance:+3,coping:0`
- **N2** → N3 | BN: ২৫ মিনিট টাইমার দিয়ে এক ধাপ শেষ করি | EN: Set a 25-minute timer and finish one step | score: `coping:+3,clarity:+1`
- **N3** → END_OK | BN: সবচেয়ে জরুরি অংশটা আগে শেষ করি | EN: Finish the most urgent part first | score: `coping:+3,clarity:+2`
- **N4** → N3 | BN: অসুবিধা বুঝিয়ে ক্লাসমেটকে মেসেজ করি | EN: Message a classmate explaining I'm stuck | score: `help_seeking:+2,coping:+1`

---

## SCN_005: নতুন পরিবেশে একা লাগা / Feeling Alone in New Environment

- **ক্যাটাগরি:** social
- **কঠিনতা:** easy
- **ট্যাগ:** loneliness,social_anxiety
- **সময়:** 6 মিনিট

### সেটিং (বাংলা)
নতুন সেমিস্টার। সবাই গ্রুপে আড্ডা দিচ্ছে। তুমি একা বসে আছ।

### শুরুর দৃশ্য (বাংলা)
লাঞ্চ ব্রেকে কাউকে জিজ্ঞেস করতে ইচ্ছে করছে না।

### শুরুর দৃশ্য (English)
At lunch you want to ask someone but can't.

### চয়েস ও স্কোর

- **N1** → N2 | BN: পাশের টেবিলে হাসিমুখে জয়েন করতে চাই কি জিজ্ঞেস করি | EN: Smile and ask to join the nearby table | score: `coping:+2,help_seeking:+1`
- **N1** → END_FAIL | BN: ফোনে ভিডিও দেখি — একা থাকাই ভালো | EN: Watch videos on my phone and stay alone | score: `avoidance:+4,coping:0`
- **N1** → N2 | BN: লাইব্রেরিতে গিয়ে শান্ত পরিবেশে বসি | EN: Go to the library for a calmer space | score: `coping:+1,clarity:+1`
- **N2** → END_OK | BN: নিজের পরিচয় দিয়ে কথা শুরু করি | EN: Introduce myself and start a conversation | score: `coping:+3,clarity:+1`

---

## SCN_006: রিজাল্টের আগে উদ্বেগ / Result Day Anxiety

- **ক্যাটাগরি:** exam
- **কঠিনতা:** medium
- **ট্যাগ:** exam_panic,academic_stress
- **সময়:** 7 মিনিট

### সেটিং (বাংলা)
রিজাল্ট আজ। ফোনে বারবার চেক করছ।

### শুরুর দৃশ্য (বাংলা)
মনে হচ্ছে বাবা-মা হতাশ হবে যদি খারাপ হয়।

### শুরুর দৃশ্য (English)
You fear disappointing parents if grades are bad.

### চয়েস ও স্কোর

- **N1** → N2 | BN: ফোন একপাশে রেখে শ্বাসের অনুশীলন করি | EN: Put the phone aside and do breathing exercises | score: `coping:+2,clarity:+1`
- **N1** → N2 | BN: বন্ধুকে কল করে অনুভূতি শেয়ার করি | EN: Call a friend and share how I feel | score: `help_seeking:+3,coping:+1`
- **N1** → N3 | BN: বারবার রিফ্রেশ করি — ফলাফল এখনই দেখতে হবে | EN: Keep refreshing — I must see results now | score: `avoidance:+2,coping:0`
- **N2** → END_OK | BN: মনে করিয়ে দিই যে একটা পরীক্ষা আমাকে সংজ্ঞায়িত করে না | EN: Remind myself one exam doesn't define me | score: `coping:+3,clarity:+2`
- **N3** → END_FAIL | BN: বাবা-মাকে আগে থেকেই খারাপ খবর দেওয়ার কথা ভাবি | EN: Assume the worst and dread telling my parents | score: `avoidance:+3,coping:0`

---

## SCN_007: টিচারের সামনে প্রশ্ন করতে ভয় / Afraid to Ask Teacher

- **ক্যাটাগরি:** social
- **কঠিনতা:** easy
- **ট্যাগ:** social_anxiety,academic_stress
- **সময়:** 5 মিনিট

### সেটিং (বাংলা)
ক্লাস শেষ। টিচার চলে যাচ্ছেন। টপিকটা বুঝোনি।

### শুরুর দৃশ্য (বাংলা)
হাত তুলতে পারছ না — সবাই কী ভাববে?

### শুরুর দৃশ্য (English)
You can't raise your hand — what will others think?

### চয়েস ও স্কোর

- **N1** → N2 | BN: ক্লাসমেটকে ফিসফিস করে জিজ্ঞেস করি | EN: Whisper a question to a classmate | score: `help_seeking:+1,coping:+1`
- **N1** → END_FAIL | BN: চুপ থাকি — পরে গুগল করব | EN: Stay quiet and Google it later | score: `avoidance:+4,coping:0`
- **N1** → N2 | BN: হাত তুলে টিচারকে একটা প্রশ্ন করি | EN: Raise my hand and ask the teacher one question | score: `coping:+2,help_seeking:+2`
- **N2** → END_OK | BN: যা বুঝিনি সেটা স্পষ্ট করে বলি | EN: Clearly say what I didn't understand | score: `coping:+3,clarity:+2`

---

## SCN_008: গ্রুপ স্টাডিতে চাপ / Group Study Pressure

- **ক্যাটাগরি:** social
- **কঠিনতা:** medium
- **ট্যাগ:** social_anxiety,academic_stress
- **সময়:** 8 মিনিট

### সেটিং (বাংলা)
গ্রুপ স্টাডি। সবাই তোমার চেয়ে এগিয়ে।

### শুরুর দৃশ্য (বাংলা)
মনে হচ্ছে তুমি সবচেয়ে কম জানো।

### শুরুর দৃশ্য (English)
You feel like you know the least.

### চয়েস ও স্কোর

- **N1** → END_FAIL | BN: নিজের অজ্ঞতা লুকিয়ে মাথা নাড়ি | EN: Hide confusion and just nod along | score: `avoidance:+4,coping:0`
- **N1** → N2 | BN: সতীর্থকে বলি আমি যা বুঝিনি সেটা বুঝিয়ে দিক | EN: Tell the group what I don't understand | score: `help_seeking:+2,coping:+1`
- **N1** → N2 | BN: ৫ মিনিট বিরতি নিয়ে পানি খাই | EN: Take a 5-minute break and drink water | score: `coping:+1,clarity:+1`
- **N2** → END_OK | BN: গ্রুপে আমার শেখার গতি সম্পর্কে সৎ হই | EN: Honestly share my learning pace with the group | score: `coping:+3,clarity:+2,empathy:+1`

---

## SCN_009: রুমমেটের সাথে টেনশন / Roommate Tension

- **ক্যাটাগরি:** conflict
- **কঠিনতা:** medium
- **ট্যাগ:** relationship_stress,academic_stress
- **সময়:** 6 মিনিট

### সেটিং (বাংলা)
হোস্টেল রুম। রুমমেট জোরে গান বাজাচ্ছে, পরীক্ষা কাল।

### শুরুর দৃশ্য (বাংলা)
বলতে ইচ্ছে করছে কিন্তু ঝগড়া হবে ভেবে থামছ।

### শুরুর দৃশ্য (English)
You want to speak up but fear conflict.

### চয়েস ও স্কোর

- **N1** → END_FAIL | BN: ইয়ারপ্লাগ লাগিয়ে সহ্য করি | EN: Use earplugs and endure it | score: `avoidance:+3,coping:0`
- **N1** → END_FAIL | BN: রাগ করে চিৎকার করি | EN: Yell in anger | score: `conflict:+4,avoidance:+1`
- **N1** → N2 | BN: শান্তভাবে বলি পরীক্ষা কাল — একটু কম শব্দ চাই | EN: Calmly say exam is tomorrow and ask for quieter volume | score: `coping:+2,clarity:+1`
- **N2** → END_OK | BN: সমঝোতায় সময় ঠিক করি — কখন গান বন্ধ করবে | EN: Agree on a time to turn the music off | score: `coping:+3,clarity:+2,empathy:+1`

---

## SCN_010: ক্যাম্পাস ইন্টারভিউ / Campus Job Interview

- **ক্যাটাগরি:** presentation
- **কঠিনতা:** hard
- **ট্যাগ:** social_anxiety,exam_panic
- **সময়:** 10 মিনিট

### সেটিং (বাংলা)
ছোট ইন্টারভিউ রুম। দুজন ইন্টারভিউয়ার।

### শুরুর দৃশ্য (বাংলা)
'Tell us about yourself' — মাথা ফাঁকা।

### শুরুর দৃশ্য (English)
'Tell us about yourself' — mind goes blank.

### চয়েস ও স্কোর

- **N1** → N2 | BN: আগে থেকে প্রস্তুত উত্তরের এক লাইন মনে করি | EN: Recall one prepared line from my answer | score: `coping:+2,clarity:+1`
- **N1** → N2 | BN: এক গ্লাস পানি চেয়ে সময় নিই | EN: Ask for a glass of water to buy time | score: `help_seeking:+2,coping:+1`
- **N1** → END_FAIL | BN: দুঃখ প্রকাশ করে বের হয়ে যাই | EN: Apologize and leave the interview | score: `avoidance:+5,coping:0`
- **N2** → END_OK | BN: নাম ও বিভাগ বলে শুরু করি | EN: Start with my name and department | score: `coping:+3,clarity:+2`

---
