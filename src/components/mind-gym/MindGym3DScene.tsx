type SceneCategory = 'exam' | 'presentation' | 'conflict' | 'social' | 'academic_stress' | string

interface MindGym3DSceneProps {
  label?: string
  category?: SceneCategory
  npcEmotion?: string | null
  imageUrl?: string | null
}

const imageByCategory: Record<string, string> = {
  exam: '/images/mind-gym/exam.jpg',
  presentation: '/images/mind-gym/presentation.jpg',
  conflict: '/images/mind-gym/conflict.jpg',
  social: '/images/mind-gym/social.jpg',
  academic_stress: '/images/mind-gym/academic_stress.jpg',
  interview: '/images/mind-gym/interview.jpg',
  result_day: '/images/mind-gym/result_day.jpg',
  group_study: '/images/mind-gym/group_study.jpg',
  lonely_campus: '/images/mind-gym/lonely_campus.jpg',
  ask_teacher: '/images/mind-gym/ask_teacher.jpg',
  roommate: '/images/mind-gym/roommate.jpg',
  deadline: '/images/mind-gym/deadline.jpg',
}

function emotionBadgeStyle(emotion?: string | null): string {
  switch (emotion) {
    case 'encouraging':
      return 'border-emerald-300/40 bg-emerald-200/20 text-emerald-100'
    case 'skeptical':
      return 'border-orange-300/40 bg-orange-200/20 text-orange-100'
    case 'anxious':
      return 'border-rose-300/40 bg-rose-200/20 text-rose-100'
    default:
      return 'border-white/30 bg-black/30 text-ink-light'
  }
}

export function MindGym3DScene({ label, category = 'exam', npcEmotion, imageUrl }: MindGym3DSceneProps) {
  const imageSrc = imageUrl || imageByCategory[category] || imageByCategory.exam

  return (
    <div className="relative h-36 w-full overflow-hidden rounded-lg border border-peacock/20 bg-black/70 sm:h-40">
      <img
        src={imageSrc}
        alt={`Mind Gym ${category} scenario`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

      {label && (
        <p className="absolute left-3 top-2 z-10 rounded-full bg-black/45 px-2.5 py-0.5 text-xs text-ink-light">
          {label}
        </p>
      )}

      {npcEmotion && (
        <p
          className={`absolute bottom-3 right-3 z-10 rounded-full border px-2.5 py-1 text-xs font-medium ${emotionBadgeStyle(npcEmotion)}`}
        >
          NPC: {npcEmotion}
        </p>
      )}
    </div>
  )
}
