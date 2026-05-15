import type { MindfulnessSession } from '@/types/sessions';

// ─── Session Library ──────────────────────────────────────
// Inspired by Headspace, Petit Bambou, Calm
// Keep step text under 20 words for TTS clarity
// Each session is self-contained, no API calls needed

export const SESSIONS: MindfulnessSession[] = [
  {
    id: 'three-breath-reset',
    title: 'Three-Breath Reset',
    description: 'The shortest possible mindfulness practice. Three conscious breaths to reset your nervous system.',
    category: 'quick',
    duration: 60,
    color: '#4ECDC4',
    steps: [
      { text: 'Pause whatever you are doing. Let your shoulders drop.', duration: 8, breathIn: 3, breathHold: 1, breathOut: 4 },
      { text: 'First breath. Inhale slowly through your nose. Feel your chest expand.', duration: 10, breathIn: 4, breathHold: 1, breathOut: 5 },
      { text: 'Second breath. A little deeper. Let the belly soften on the exhale.', duration: 10, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Third breath. The deepest yet. Feel the ground beneath you.', duration: 10, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'That is enough. Carry this stillness with you.', duration: 6, breathIn: 3, breathHold: 1, breathOut: 4 },
    ],
  },
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: 'Navy SEAL technique for focus and calm. Four equal sides: inhale, hold, exhale, hold.',
    category: 'breathing',
    duration: 180,
    color: '#D4A853',
    steps: [
      { text: 'Sit comfortably. Spine tall but not rigid. Close your eyes or soften your gaze.', duration: 10, breathIn: 4, breathHold: 4, breathOut: 4 },
      { text: 'Breathe in for four counts. One. Two. Three. Four.', duration: 8, breathIn: 4, breathHold: 0, breathOut: 0 },
      { text: 'Hold. One. Two. Three. Four.', duration: 6, breathIn: 0, breathHold: 4, breathOut: 0 },
      { text: 'Breathe out for four counts. One. Two. Three. Four.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 4 },
      { text: 'Hold. One. Two. Three. Four.', duration: 6, breathIn: 0, breathHold: 4, breathOut: 0 },
      { text: 'Again. Inhale. One. Two. Three. Four.', duration: 8, breathIn: 4, breathHold: 0, breathOut: 0 },
      { text: 'Hold the breath. Steady. Calm.', duration: 6, breathIn: 0, breathHold: 4, breathOut: 0 },
      { text: 'Exhale slowly. Release tension with the breath.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 4 },
      { text: 'Empty pause. Rest in the stillness.', duration: 6, breathIn: 0, breathHold: 4, breathOut: 0 },
      { text: 'One more cycle. Make it your smoothest yet.', duration: 20, breathIn: 4, breathHold: 4, breathOut: 4 },
      { text: 'Let the breath return to its natural rhythm. Notice how you feel.', duration: 10, breathIn: 3, breathHold: 1, breathOut: 4 },
    ],
  },
  {
    id: 'sleep-wind-down',
    title: 'Sleep Wind-Down',
    description: 'Progressive body relaxation to ease into deep, restful sleep. Best practiced in bed.',
    category: 'sleep',
    duration: 420,
    color: '#8A7BB5',
    steps: [
      { text: 'Lie on your back. Let your arms rest by your sides, palms facing up.', duration: 12, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Take three deep breaths. Each exhale is heavier than the last.', duration: 18, breathIn: 4, breathHold: 1, breathOut: 5 },
      { text: 'Bring attention to your feet. Notice any tension. On the next exhale, let them melt into the bed.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Move to your calves and knees. Softening. Releasing.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Your thighs and hips. Let them sink. The bed holds you completely.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Your belly. Let it rise and fall gently with each breath.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Your chest and upper back. Each exhale releases the weight of the day.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Your hands and forearms. Fingers slightly curled. Soft.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Your shoulders and neck. Drop them. Let the pillow support your head fully.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Your face. Jaw unclenched. Brow smooth. Tongue resting at the bottom of your mouth.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'Your whole body now. One continuous field of softness and warmth.', duration: 20, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'If thoughts arise, let them pass like clouds. Return to the breath.', duration: 20, breathIn: 4, breathHold: 2, breathOut: 6 },
      { text: 'You are safe. You are held. Drift into rest.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 8 },
    ],
  },
  {
    id: 'body-scan-quick',
    title: 'Quick Body Scan',
    description: 'A rapid tour through the body to release tension and return to presence.',
    category: 'bodyscan',
    duration: 240,
    color: '#4ECDC4',
    steps: [
      { text: 'Sit or lie down. Close your eyes. Take a grounding breath.', duration: 10, breathIn: 4, breathHold: 1, breathOut: 5 },
      { text: 'Feet. Feel contact with the ground. Warm. Solid.', duration: 12, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Legs. Any tightness? Breathe into it. Release on the out-breath.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Belly and lower back. Let the core soften.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Chest and heart center. Open. Spacious.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Shoulders, arms, hands. Drop the weight you carry.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Neck, jaw, face. Smooth out every line of tension.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'The top of your head. Crown open. Light above.', duration: 12, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Whole body. One breath, one awareness. You are here.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 6 },
    ],
  },
  {
    id: 'loving-kindness',
    title: 'Loving-Kindness',
    description: 'Ancient Metta practice. Cultivate warmth and compassion for yourself and others.',
    category: 'lovingkindness',
    duration: 300,
    color: '#D4A853',
    steps: [
      { text: 'Settle into stillness. Place a hand on your heart. Feel its warmth.', duration: 12, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Direct these words inward. May I be happy. May I be healthy. May I be at peace.', duration: 18, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Picture someone you love. Feel that warmth expand toward them.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'May you be happy. May you be healthy. May you be at peace.', duration: 18, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Now someone neutral. A neighbor, a colleague. Extend the same wish.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'May you be happy. May you be healthy. May you be at peace.', duration: 18, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Someone difficult. Breathe. The wish does not need to be felt fully yet.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'May you be happy. May you be healthy. May you be at peace.', duration: 18, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'All beings everywhere. Woven together in one wish.', duration: 15, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'May all beings be happy. May all beings be at peace.', duration: 18, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'Rest in this warmth. Carry it with you.', duration: 12, breathIn: 4, breathHold: 2, breathOut: 5 },
    ],
  },
  {
    id: 'coherent-breathing',
    title: 'Coherent Breathing',
    description: 'HeartMath-inspired. Five breaths per minute for physiological coherence and calm.',
    category: 'breathing',
    duration: 300,
    color: '#D4A853',
    steps: [
      { text: 'Sit upright, relaxed. We breathe at five breaths per minute. Six seconds in, six out.', duration: 12, breathIn: 6, breathHold: 0, breathOut: 6 },
      { text: 'Inhale. One, two, three, four, five, six.', duration: 8, breathIn: 6, breathHold: 0, breathOut: 0 },
      { text: 'Exhale. One, two, three, four, five, six.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 6 },
      { text: 'Settle into this rhythm. The breath finds its own depth.', duration: 36, breathIn: 6, breathHold: 0, breathOut: 6 },
      { text: 'Heart rate smooths. Mind settles. Stay with the rhythm.', duration: 36, breathIn: 6, breathHold: 0, breathOut: 6 },
      { text: 'If the mind wanders, return on the next inhale. No judgment.', duration: 36, breathIn: 6, breathHold: 0, breathOut: 6 },
      { text: 'Let the breath return to natural pace. Notice the shift in your body.', duration: 12, breathIn: 4, breathHold: 1, breathOut: 5 },
    ],
  },
  {
    id: 'mindful-walk',
    title: 'Mindful Walking',
    description: 'Walking meditation you can do anywhere. Transform movement into practice.',
    category: 'walking',
    duration: 300,
    color: '#8A7BB5',
    steps: [
      { text: 'Stand still. Feel both feet on the ground. One breath.', duration: 10, breathIn: 4, breathHold: 1, breathOut: 5 },
      { text: 'Lift your right heel. Notice the shift in balance.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 0 },
      { text: 'Move the foot forward. Place it down heel first. Feel contact.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 0 },
      { text: 'Weight shifts to the right foot. Left heel lifts. Slow. Deliberate.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 0 },
      { text: 'Continue walking. Each step is the only step. Nowhere to go.', duration: 40, breathIn: 0, breathHold: 0, breathOut: 0 },
      { text: 'If you notice sounds, label them gently. Hearing. Then return to feet.', duration: 20, breathIn: 0, breathHold: 0, breathOut: 0 },
      { text: 'If you notice sights, label them. Seeing. Return to the rhythm of walking.', duration: 20, breathIn: 0, breathHold: 0, breathOut: 0 },
      { text: 'Gradually slow down. Come to stillness. Stand. Feel.', duration: 10, breathIn: 4, breathHold: 2, breathOut: 5 },
      { text: 'The walking ends. The awareness continues.', duration: 8, breathIn: 3, breathHold: 1, breathOut: 4 },
    ],
  },
  {
    id: '478-breathing',
    title: '4-7-8 Relaxation',
    description: 'Dr. Andrew Weil technique. Natural tranquilizer for the nervous system.',
    category: 'breathing',
    duration: 180,
    color: '#D4A853',
    steps: [
      { text: 'Place the tip of your tongue behind your upper front teeth. Keep it there.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 0 },
      { text: 'Exhale completely through your mouth. A whoosh sound.', duration: 8, breathIn: 0, breathHold: 0, breathOut: 8 },
      { text: 'Inhale through your nose for four. One, two, three, four.', duration: 6, breathIn: 4, breathHold: 0, breathOut: 0 },
      { text: 'Hold for seven. One, two, three, four, five, six, seven.', duration: 9, breathIn: 0, breathHold: 7, breathOut: 0 },
      { text: 'Exhale through mouth for eight. One, two, three, four, five, six, seven, eight.', duration: 10, breathIn: 0, breathHold: 0, breathOut: 8 },
      { text: 'Cycle two. Inhale four.', duration: 6, breathIn: 4, breathHold: 0, breathOut: 0 },
      { text: 'Hold seven. Steady. Still.', duration: 9, breathIn: 0, breathHold: 7, breathOut: 0 },
      { text: 'Exhale eight. Let everything go.', duration: 10, breathIn: 0, breathHold: 0, breathOut: 8 },
      { text: 'Cycle three. Your smoothest yet.', duration: 22, breathIn: 4, breathHold: 7, breathOut: 8 },
      { text: 'Let breath normalize. Feel the quiet in your body.', duration: 10, breathIn: 3, breathHold: 1, breathOut: 4 },
    ],
  },
];

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  quick: { label: 'Quick', icon: '⚡' },
  breathing: { label: 'Breathing', icon: '🫁' },
  bodyscan: { label: 'Body Scan', icon: '🔍' },
  sleep: { label: 'Sleep', icon: '🌙' },
  walking: { label: 'Walking', icon: '🚶' },
  lovingkindness: { label: 'Kindness', icon: '💛' },
};

export function getSessionById(id: string): MindfulnessSession | undefined {
  return SESSIONS.find(s => s.id === id);
}

export function getSessionsByCategory(category: string): MindfulnessSession[] {
  return SESSIONS.filter(s => s.category === category);
}
