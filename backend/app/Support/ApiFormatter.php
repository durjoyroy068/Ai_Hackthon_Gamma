<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

class ApiFormatter
{
    public static function id(Model|int $model): string
    {
        if ($model instanceof Model) {
            return (string) $model->getKey();
        }

        return (string) $model;
    }

    public static function date(?CarbonInterface $date): ?string
    {
        return $date?->toIso8601String();
    }

    public static function user(\App\Models\User $user): array
    {
        $data = [
            'id' => self::id($user),
            'fullName' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'recoveryEmail' => $user->recovery_email,
            'recoveryPhone' => $user->recovery_phone,
            'ageBand' => $user->age_band,
            'language' => $user->language,
            'country' => $user->country,
            'dateOfBirth' => $user->date_of_birth?->format('Y-m-d'),
            'gender' => $user->gender,
            'isAnonymous' => (bool) $user->is_anonymous,
            'avatarUrl' => $user->avatar_url,
            'createdAt' => self::date($user->created_at),
        ];

        if ($user->relationLoaded('guardianConsent') && $user->guardianConsent) {
            $consent = $user->guardianConsent;
            $data['guardianConsent'] = [
                'guardianName' => $consent->guardian_name,
                'guardianEmail' => $consent->guardian_email,
                'guardianPhone' => $consent->guardian_phone,
                'consentGiven' => (bool) $consent->consent_given,
                'consentDate' => self::date($consent->consent_date),
            ];
        }

        return $data;
    }

    public static function message(\App\Models\ChatMessage $message): array
    {
        return [
            'id' => self::id($message),
            'role' => $message->role,
            'content' => $message->content,
            'createdAt' => self::date($message->created_at),
            'safetyLevel' => $message->safety_level,
            'liked' => $message->liked,
        ];
    }

    public static function conversation(\App\Models\Conversation $conversation): array
    {
        return [
            'id' => self::id($conversation),
            'title' => $conversation->title,
            'messages' => $conversation->relationLoaded('messages')
                ? $conversation->messages->map(fn ($m) => self::message($m))->values()->all()
                : [],
            'pinned' => (bool) $conversation->pinned,
            'folderId' => $conversation->folder_id ? self::id($conversation->folder_id) : null,
            'createdAt' => self::date($conversation->created_at),
            'updatedAt' => self::date($conversation->updated_at),
        ];
    }

    public static function folder(\App\Models\ChatFolder $folder): array
    {
        return [
            'id' => self::id($folder),
            'name' => $folder->name,
            'color' => $folder->color,
        ];
    }

    public static function moodEntry(\App\Models\MoodEntry $entry): array
    {
        return [
            'id' => self::id($entry),
            'userId' => self::id($entry->user_id),
            'date' => $entry->date->format('Y-m-d'),
            'moodScore' => $entry->mood_score,
            'emotions' => $entry->emotions ?? [],
            'note' => $entry->note,
            'sleep' => $entry->sleep,
            'hydration' => $entry->hydration,
            'exercise' => $entry->exercise,
            'meditation' => $entry->meditation,
            'gratitude' => $entry->gratitude,
            'reflection' => $entry->reflection,
        ];
    }

    public static function assessment(\App\Models\AssessmentResult $result): array
    {
        return [
            'id' => self::id($result),
            'userId' => self::id($result->user_id),
            'scaleType' => $result->scale_type,
            'responses' => $result->responses,
            'totalScore' => $result->total_score,
            'riskLevel' => $result->risk_level,
            'mindDialogueSummary' => $result->mind_dialogue_summary,
            'createdAt' => self::date($result->created_at),
        ];
    }

    public static function recoveryPlan(\App\Models\RecoveryPlan $plan): array
    {
        return [
            'id' => self::id($plan),
            'userId' => self::id($plan->user_id),
            'startDate' => $plan->start_date->format('Y-m-d'),
            'currentDay' => $plan->current_day,
            'riskProfile' => $plan->risk_profile,
            'days' => $plan->relationLoaded('days')
                ? $plan->days->map(fn ($day) => [
                    'day' => $day->day,
                    'goals' => $day->goals,
                    'activities' => $day->relationLoaded('activities')
                        ? $day->activities->map(fn ($a) => [
                            'id' => self::id($a),
                            'labelKey' => $a->label_key,
                            'completed' => (bool) $a->completed,
                        ])->values()->all()
                        : [],
                    'tipKey' => $day->tip_key,
                    'completedPercent' => $day->completed_percent,
                ])->values()->all()
                : [],
        ];
    }

    public static function achievement(\App\Models\AchievementDefinition $def, ?string $unlockedAt): array
    {
        return [
            'id' => self::id($def),
            'titleKey' => $def->title_key,
            'descriptionKey' => $def->description_key,
            'icon' => $def->icon,
            'unlockedAt' => $unlockedAt,
            'gentle' => (bool) $def->gentle,
        ];
    }

    public static function trustedContact(\App\Models\TrustedContact $contact): array
    {
        return [
            'id' => self::id($contact),
            'name' => $contact->name,
            'phone' => $contact->phone,
            'relationship' => $contact->relationship,
        ];
    }

    public static function safetyPlan(\App\Models\SafetyPlan $plan): array
    {
        return [
            'id' => self::id($plan),
            'warningSigns' => $plan->warning_signs ?? [],
            'copingStrategies' => $plan->coping_strategies ?? [],
            'distractions' => $plan->distractions ?? [],
            'trustedPeople' => $plan->trusted_people ?? [],
            'professionalContacts' => $plan->professional_contacts ?? [],
            'safeEnvironment' => $plan->safe_environment ?? [],
        ];
    }

    public static function notification(\App\Models\Notification $notification): array
    {
        return [
            'id' => self::id($notification),
            'titleKey' => $notification->title_key,
            'bodyKey' => $notification->body_key,
            'read' => (bool) $notification->read,
            'createdAt' => self::date($notification->created_at),
        ];
    }
}
