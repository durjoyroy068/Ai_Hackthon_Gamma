<?php

namespace Database\Seeders;

use App\Models\AchievementDefinition;
use App\Models\ChatFolder;
use App\Models\ChatMessage;
use App\Models\ChatResponseTemplate;
use App\Models\Conversation;
use App\Models\EmergencyResource;
use App\Models\FaqItem;
use App\Models\MoodEntry;
use App\Models\Notification;
use App\Models\TrustedContact;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserSetting;
use App\Services\RecoveryPlanService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'full_name' => 'Admin',
            'email' => 'admin@monsonglap.com',
            'password' => Hash::make('admin12345'),
            'is_admin' => true,
            'onboarding_complete' => true,
            'language' => 'en',
        ]);

        $demoUser = User::create([
            'full_name' => 'আয়েশা রহমান',
            'email' => 'ayesha@example.com',
            'phone' => '+8801712345678',
            'recovery_email' => 'ayesha.recovery@example.com',
            'recovery_phone' => '+8801812345678',
            'password' => Hash::make('password123'),
            'age_band' => '18-24',
            'language' => 'bn',
            'country' => 'Bangladesh',
            'date_of_birth' => '2003-05-15',
            'gender' => 'female',
            'onboarding_complete' => true,
            'email_verified_at' => now(),
            'phone_verified' => true,
        ]);

        UserSetting::create(['user_id' => $demoUser->id]);

        EmergencyResource::insert([
            ['name' => 'Child Helpline', 'name_bn' => 'শিশু সহায়তা ১০৯৮', 'phone' => '1098', 'url' => 'https://www.childhelpline1098.in', 'region' => 'Bangladesh', 'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Kaan Pete Roi', 'name_bn' => 'কান পেতে রই', 'phone' => '01779554391', 'url' => 'https://www.shuni.org', 'region' => 'Bangladesh', 'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Alapon', 'name_bn' => 'আলাপন', 'phone' => '10616', 'url' => null, 'region' => 'Bangladesh', 'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);

        ChatResponseTemplate::insert([
            ['category' => 'default', 'content' => 'তোমার কথা শুনছি। একটু বিস্তারিত বলতে পারো?', 'keywords' => json_encode([]), 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'default', 'content' => 'এটা শুনে মনে হচ্ছে তুমি সত্যিই চেষ্টা করছ। তোমার অনুভূতি স্বাভাবিক।', 'keywords' => json_encode([]), 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['category' => 'stress', 'content' => 'চাপ অনুভব করা মানে তুমি দুর্বল নও — তুমি মানুষ। কোন কাজটা সবচেয়ে বেশি ভারী লাগছে?', 'keywords' => json_encode(['চাপ', 'stress', 'পরীক্ষা']), 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        FaqItem::insert([
            ['question_key' => 'landing.faq.q1', 'answer_key' => 'landing.faq.a1', 'category' => 'general', 'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['question_key' => 'landing.faq.q2', 'answer_key' => 'landing.faq.a2', 'category' => 'general', 'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $achievements = [
            ['title_key' => 'achievements.firstCheckIn.title', 'description_key' => 'achievements.firstCheckIn.description', 'icon' => 'heart', 'gentle' => true, 'unlock_criteria' => 'first_mood', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['title_key' => 'achievements.weekStreak.title', 'description_key' => 'achievements.weekStreak.description', 'icon' => 'calendar', 'gentle' => true, 'unlock_criteria' => 'week_streak', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['title_key' => 'achievements.firstChat.title', 'description_key' => 'achievements.firstChat.description', 'icon' => 'message', 'gentle' => true, 'unlock_criteria' => 'first_chat', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['title_key' => 'achievements.assessment.title', 'description_key' => 'achievements.assessment.description', 'icon' => 'clipboard', 'gentle' => false, 'unlock_criteria' => 'first_assessment', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];
        AchievementDefinition::insert($achievements);

        UserAchievement::create([
            'user_id' => $demoUser->id,
            'achievement_definition_id' => 1,
            'unlocked_at' => now()->subDays(3),
        ]);

        $folder1 = ChatFolder::create(['user_id' => $demoUser->id, 'name' => 'পরীক্ষার চাপ', 'color' => '#F0C33F']);
        ChatFolder::create(['user_id' => $demoUser->id, 'name' => 'রাতের ভাবনা', 'color' => '#B9D2C4']);

        $conv = Conversation::create([
            'user_id' => $demoUser->id,
            'title' => 'আজকের মনের অবস্থা',
            'pinned' => true,
            'folder_id' => $folder1->id,
        ]);

        ChatMessage::create(['conversation_id' => $conv->id, 'role' => 'user', 'content' => 'আজ মনটা একটু ভারী লাগছে, পরীক্ষা কাছে এসেছে।', 'created_at' => now()->subHour()]);
        ChatMessage::create(['conversation_id' => $conv->id, 'role' => 'assistant', 'content' => 'পরীক্ষার চাপ অনেকের জন্যই ভারী হয় — তুমি একা নও। চল, একটু ধীরে ধীরে বলো, কোন বিষয়টা সবচেয়ে বেশি চাপ দিচ্ছে?', 'created_at' => now()->subMinutes(58)]);

        MoodEntry::create([
            'user_id' => $demoUser->id,
            'date' => now()->subDays(1)->toDateString(),
            'mood_score' => 6,
            'emotions' => ['calm', 'anxious'],
            'note' => 'পরীক্ষার চাপ ছিল',
            'sleep' => 5,
            'hydration' => 7,
        ]);

        TrustedContact::create([
            'user_id' => $demoUser->id,
            'name' => 'মা',
            'phone' => '+8801812345678',
            'relationship' => 'parent',
        ]);

        Notification::insert([
            ['user_id' => $demoUser->id, 'title_key' => 'notifications.moodReminder.title', 'body_key' => 'notifications.moodReminder.body', 'read' => false, 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $demoUser->id, 'title_key' => 'notifications.weeklyReport.title', 'body_key' => 'notifications.weeklyReport.body', 'read' => true, 'created_at' => now()->subDay(), 'updated_at' => now()->subDay()],
        ]);

        app(RecoveryPlanService::class)->ensureForUser($demoUser, 'mild');

        $this->call(MindGymSeeder::class);
    }
}
