<?php

namespace Database\Seeders;

use App\Models\MindGymChoice;
use App\Models\MindGymScenario;
use Illuminate\Database\Seeder;

class MindGymSeeder extends Seeder
{
    public function run(): void
    {
        $base = dirname(base_path()).DIRECTORY_SEPARATOR.'Dataset'.DIRECTORY_SEPARATOR.'MindGym';
        $scenariosFile = $base.DIRECTORY_SEPARATOR.'02_scenario_templates.csv';
        $choicesFile = $base.DIRECTORY_SEPARATOR.'03_branching_choices.csv';

        if (! file_exists($scenariosFile)) {
            $this->command?->warn('MindGym CSV not found at '.$scenariosFile);

            return;
        }

        $scenarioMap = [];

        if (($handle = fopen($scenariosFile, 'r')) !== false) {
            $headers = fgetcsv($handle);
            while (($row = fgetcsv($handle)) !== false) {
                $data = array_combine($headers, $row);
                $scenario = MindGymScenario::updateOrCreate(
                    ['code' => $data['scenario_id']],
                    [
                        'title_bn' => $data['title_bn'],
                        'title_en' => $data['title_en'],
                        'category' => $data['category'],
                        'difficulty' => $data['difficulty'],
                        'intake_tags' => $data['intake_tags'] ?? null,
                        'setting_description_bn' => $data['setting_description_bn'],
                        'setting_description_en' => $data['setting_description_en'],
                        'opening_scene_bn' => $data['opening_scene_bn'],
                        'opening_scene_en' => $data['opening_scene_en'],
                        'npc_roles' => $data['npc_roles'] ?? null,
                        'duration_minutes' => (int) ($data['duration_minutes'] ?? 8),
                        'is_active' => true,
                    ]
                );
                $scenarioMap[$data['scenario_id']] = $scenario->id;
            }
            fclose($handle);
        }

        MindGymChoice::query()->delete();

        if (file_exists($choicesFile) && ($handle = fopen($choicesFile, 'r')) !== false) {
            $headers = fgetcsv($handle);
            while (($row = fgetcsv($handle)) !== false) {
                $data = array_combine($headers, $row);
                $scenarioId = $scenarioMap[$data['scenario_id']] ?? null;
                if (! $scenarioId) {
                    continue;
                }

                MindGymChoice::create([
                    'scenario_id' => $scenarioId,
                    'node_id' => $data['node_id'],
                    'choice_text_bn' => $data['choice_text_bn'],
                    'choice_text_en' => $data['choice_text_en'],
                    'next_node_id' => $data['next_node_id'],
                    'score_impact' => $this->parseScoreImpact($data['score_impact'] ?? ''),
                    'difficulty_delta' => (int) ($data['difficulty_delta'] ?? 0),
                ]);
            }
            fclose($handle);
        }
    }

    private function parseScoreImpact(string $raw): array
    {
        $impact = [];
        foreach (explode(',', $raw) as $part) {
            $part = trim($part);
            if (! str_contains($part, ':')) {
                if (str_contains($part, '+')) {
                    [$k, $v] = explode('+', $part);
                    $impact[trim($k)] = (int) trim($v);
                }

                continue;
            }
            [$key, $val] = explode(':', $part, 2);
            $impact[trim($key)] = (int) str_replace('+', '', trim($val));
        }

        return $impact;
    }
}
