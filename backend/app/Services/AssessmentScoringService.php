<?php

namespace App\Services;

class AssessmentScoringService
{
    private const RISK_THRESHOLDS = [
        'PHQ-9' => [4, 9, 14],
        'GAD-7' => [4, 9, 14],
        'PHQ-A' => [4, 9, 14],
        'RCADS' => [4, 9, 14],
    ];

    public function score(string $scaleType, array $responses): array
    {
        $total = array_sum(array_map('intval', $responses));
        $thresholds = self::RISK_THRESHOLDS[$scaleType] ?? [4, 9, 14];

        $riskLevel = match (true) {
            $total <= $thresholds[0] => 'minimal',
            $total <= $thresholds[1] => 'mild',
            $total <= $thresholds[2] => 'moderate',
            default => 'high',
        };

        return [
            'totalScore' => $total,
            'riskLevel' => $riskLevel,
            'mindDialogueSummary' => "assessment.summary.{$riskLevel}",
        ];
    }
}
