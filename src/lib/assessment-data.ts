import type { ScaleType, AssessmentQuestion } from '@/types'

export const PHQ9_QUESTIONS: AssessmentQuestion[] = [
  { id: 'q1', textKey: 'assessment.phq9.q1', scaleType: 'PHQ-9' },
  { id: 'q2', textKey: 'assessment.phq9.q2', scaleType: 'PHQ-9' },
  { id: 'q3', textKey: 'assessment.phq9.q3', scaleType: 'PHQ-9' },
  { id: 'q4', textKey: 'assessment.phq9.q4', scaleType: 'PHQ-9' },
  { id: 'q5', textKey: 'assessment.phq9.q5', scaleType: 'PHQ-9' },
  { id: 'q6', textKey: 'assessment.phq9.q6', scaleType: 'PHQ-9' },
  { id: 'q7', textKey: 'assessment.phq9.q7', scaleType: 'PHQ-9' },
  { id: 'q8', textKey: 'assessment.phq9.q8', scaleType: 'PHQ-9' },
  { id: 'q9', textKey: 'assessment.phq9.q9', scaleType: 'PHQ-9' },
]

export const GAD7_QUESTIONS: AssessmentQuestion[] = [
  { id: 'g1', textKey: 'assessment.gad7.q1', scaleType: 'GAD-7' },
  { id: 'g2', textKey: 'assessment.gad7.q2', scaleType: 'GAD-7' },
  { id: 'g3', textKey: 'assessment.gad7.q3', scaleType: 'GAD-7' },
  { id: 'g4', textKey: 'assessment.gad7.q4', scaleType: 'GAD-7' },
  { id: 'g5', textKey: 'assessment.gad7.q5', scaleType: 'GAD-7' },
  { id: 'g6', textKey: 'assessment.gad7.q6', scaleType: 'GAD-7' },
  { id: 'g7', textKey: 'assessment.gad7.q7', scaleType: 'GAD-7' },
]

export const PHQA_QUESTIONS: AssessmentQuestion[] = [
  { id: 'pa1', textKey: 'assessment.phqa.q1', scaleType: 'PHQ-A' },
  { id: 'pa2', textKey: 'assessment.phqa.q2', scaleType: 'PHQ-A' },
  { id: 'pa3', textKey: 'assessment.phqa.q3', scaleType: 'PHQ-A' },
  { id: 'pa4', textKey: 'assessment.phqa.q4', scaleType: 'PHQ-A' },
  { id: 'pa5', textKey: 'assessment.phqa.q5', scaleType: 'PHQ-A' },
  { id: 'pa6', textKey: 'assessment.phqa.q6', scaleType: 'PHQ-A' },
  { id: 'pa7', textKey: 'assessment.phqa.q7', scaleType: 'PHQ-A' },
  { id: 'pa8', textKey: 'assessment.phqa.q8', scaleType: 'PHQ-A' },
  { id: 'pa9', textKey: 'assessment.phqa.q9', scaleType: 'PHQ-A' },
]

export const RCADS_QUESTIONS: AssessmentQuestion[] = [
  { id: 'r1', textKey: 'assessment.rcads.q1', scaleType: 'RCADS' },
  { id: 'r2', textKey: 'assessment.rcads.q2', scaleType: 'RCADS' },
  { id: 'r3', textKey: 'assessment.rcads.q3', scaleType: 'RCADS' },
  { id: 'r4', textKey: 'assessment.rcads.q4', scaleType: 'RCADS' },
  { id: 'r5', textKey: 'assessment.rcads.q5', scaleType: 'RCADS' },
  { id: 'r6', textKey: 'assessment.rcads.q6', scaleType: 'RCADS' },
  { id: 'r7', textKey: 'assessment.rcads.q7', scaleType: 'RCADS' },
]

export function getQuestionsForScale(scaleType: ScaleType): AssessmentQuestion[] {
  switch (scaleType) {
    case 'PHQ-9':
      return PHQ9_QUESTIONS
    case 'GAD-7':
      return GAD7_QUESTIONS
    case 'PHQ-A':
      return PHQA_QUESTIONS
    case 'RCADS':
      return RCADS_QUESTIONS
    default:
      return PHQ9_QUESTIONS
  }
}

export function getScalesForAgeBand(ageBand: string): ScaleType[] {
  if (ageBand === '13-17') return ['PHQ-A', 'RCADS']
  return ['PHQ-9', 'GAD-7']
}

export function calculateRiskLevel(
  scaleType: ScaleType,
  totalScore: number
): 'minimal' | 'mild' | 'moderate' | 'high' {
  if (scaleType === 'PHQ-9' || scaleType === 'PHQ-A') {
    if (totalScore <= 4) return 'minimal'
    if (totalScore <= 9) return 'mild'
    if (totalScore <= 14) return 'moderate'
    return 'high'
  }
  if (scaleType === 'GAD-7') {
    if (totalScore <= 4) return 'minimal'
    if (totalScore <= 9) return 'mild'
    if (totalScore <= 14) return 'moderate'
    return 'high'
  }
  if (totalScore <= 10) return 'minimal'
  if (totalScore <= 20) return 'mild'
  if (totalScore <= 30) return 'moderate'
  return 'high'
}

export const RESPONSE_OPTIONS = [
  { value: 0, labelKey: 'assessment.options.notAtAll' },
  { value: 1, labelKey: 'assessment.options.severalDays' },
  { value: 2, labelKey: 'assessment.options.moreThanHalf' },
  { value: 3, labelKey: 'assessment.options.nearlyEvery' },
]

export const EMERGENCY_RESOURCES = [
  {
    id: '1098',
    nameKey: 'emergency.resources.helpline1098.name',
    phone: '1098',
    descriptionKey: 'emergency.resources.helpline1098.description',
    url: 'https://www.mohfw.gov.in/',
  },
  {
    id: 'kaan-pete-roi',
    nameKey: 'emergency.resources.kaanPeteRoi.name',
    phone: '+8809604445555',
    descriptionKey: 'emergency.resources.kaanPeteRoi.description',
    url: 'https://www.kaanpeteroi.com/',
  },
  {
    id: 'alapon',
    nameKey: 'emergency.resources.alapon.name',
    phone: '+8801787111111',
    descriptionKey: 'emergency.resources.alapon.description',
    url: 'https://alaponbd.com/',
  },
]
