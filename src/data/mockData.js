// Mock AI responses for demo mode — realistic distortion-tagged conversations

export const MOCK_DISTORTIONS = [
  {
    text: "This is going to ruin everything I've worked for",
    distortions: [
      { key: 'catastrophizing', severity: 4, label: 'Catastrophizing' },
    ],
  },
  {
    text: "He thinks I'm completely incompetent",
    distortions: [
      { key: 'mind_reading', severity: 3, label: 'Mind Reading' },
      { key: 'labeling', severity: 2, label: 'Labeling' },
    ],
  },
  {
    text: "I always mess up in these situations, it's just what I do",
    distortions: [
      { key: 'all_or_nothing', severity: 3, label: 'All-or-Nothing' },
      { key: 'labeling', severity: 3, label: 'Labeling' },
    ],
  },
  {
    text: "I shouldn't be so nervous — a normal person wouldn't feel this way",
    distortions: [
      { key: 'should_statements', severity: 3, label: 'Should Statements' },
      { key: 'emotional_reasoning', severity: 2, label: 'Emotional Reasoning' },
    ],
  },
]

export const MOCK_CBT_REPORT = {
  assertiveness_score: 4,
  session_duration_minutes: 8,
  total_distortions: 7,
  top_distortions: [
    {
      key: 'catastrophizing',
      label: 'Catastrophizing',
      count: 3,
      avg_severity: 3.7,
      quotes: [
        {
          text: "This is going to ruin everything I've worked for",
          severity: 4,
          reframe: "This is a difficult conversation, but one conversation doesn't determine my entire future. I can recover from this.",
        },
        {
          text: "If he rejects this project my career is over before it starts",
          severity: 4,
          reframe: "Getting critical feedback is part of the process. Even if this proposal isn't accepted, I'll learn from it and improve.",
        },
      ],
    },
    {
      key: 'mind_reading',
      label: 'Mind Reading',
      count: 2,
      avg_severity: 3.0,
      quotes: [
        {
          text: "He thinks I'm completely incompetent",
          severity: 3,
          reframe: "I don't actually know what he thinks. His questions might mean he's engaged, not dismissive.",
        },
      ],
    },
    {
      key: 'should_statements',
      label: 'Should Statements',
      count: 2,
      avg_severity: 2.5,
      quotes: [
        {
          text: "I shouldn't be so nervous — a normal person wouldn't feel this way",
          severity: 3,
          reframe: "Feeling nervous in high-stakes situations is human. I can acknowledge the nerves and still perform well.",
        },
      ],
    },
  ],
  avoidance_events: [
    { type: 'deflection', text: "I mean, I don't know, maybe...", timestamp: '2:34' },
    { type: 'over_apologizing', text: "Sorry, I'm sorry, I know this isn't what you wanted", timestamp: '4:12' },
  ],
  session_insights: "You showed courage by staying in the conversation despite high pressure. Your main pattern was catastrophizing — assuming worst-case outcomes from ambiguous signals. The professor's directness triggered mind-reading in you. Focus on separating facts from interpretations.",
  growth_note: "Compared to your baseline, you held your position 40% longer before deflecting. That's real progress.",
}

export const MOCK_PROGRESS_DATA = {
  sessions: [
    { session: 1, date: '2024-01-08', assertiveness: 3.2, catastrophizing: 5, mind_reading: 3, all_or_nothing: 2, difficulty: 1 },
    { session: 2, date: '2024-01-10', assertiveness: 3.5, catastrophizing: 4, mind_reading: 4, all_or_nothing: 3, difficulty: 1 },
    { session: 3, date: '2024-01-13', assertiveness: 4.1, catastrophizing: 4, mind_reading: 2, all_or_nothing: 2, difficulty: 2 },
    { session: 4, date: '2024-01-15', assertiveness: 4.0, catastrophizing: 3, mind_reading: 3, all_or_nothing: 1, difficulty: 2 },
    { session: 5, date: '2024-01-18', assertiveness: 4.8, catastrophizing: 3, mind_reading: 2, all_or_nothing: 2, difficulty: 2 },
    { session: 6, date: '2024-01-20', assertiveness: 5.2, catastrophizing: 2, mind_reading: 2, all_or_nothing: 1, difficulty: 3 },
    { session: 7, date: '2024-01-22', assertiveness: 5.0, catastrophizing: 2, mind_reading: 1, all_or_nothing: 0, difficulty: 3 },
    { session: 8, date: '2024-01-25', assertiveness: 5.8, catastrophizing: 1, mind_reading: 2, all_or_nothing: 1, difficulty: 3 },
    { session: 9, date: '2024-01-27', assertiveness: 6.2, catastrophizing: 1, mind_reading: 1, all_or_nothing: 0, difficulty: 4 },
    { session: 10, date: '2024-01-30', assertiveness: 6.7, catastrophizing: 1, mind_reading: 0, all_or_nothing: 1, difficulty: 4 },
  ],
  streak: 7,
  total_sessions: 10,
  improvement_pct: 34,
  best_scenario: 'Scenario E — Workplace Small Talk',
}

export const classifyMessage = (text) => {
  // Simple keyword-based mock classification for demo
  const distortions = []
  const lower = text.toLowerCase()

  if (lower.includes('ruin') || lower.includes('disaster') || lower.includes('worst') || lower.includes('everything')) {
    distortions.push({ key: 'catastrophizing', severity: Math.ceil(Math.random() * 2) + 2, label: 'Catastrophizing' })
  }
  if (lower.includes('thinks') || lower.includes('he knows') || lower.includes('she knows') || lower.includes('they think')) {
    distortions.push({ key: 'mind_reading', severity: Math.ceil(Math.random() * 2) + 2, label: 'Mind Reading' })
  }
  if (lower.includes('always') || lower.includes('never') || lower.includes('everyone') || lower.includes('nobody')) {
    distortions.push({ key: 'all_or_nothing', severity: Math.ceil(Math.random() * 2) + 1, label: 'All-or-Nothing' })
  }
  if (lower.includes('my fault') || lower.includes("i'm the reason") || lower.includes('because of me') || lower.includes("blame myself")) {
    distortions.push({ key: 'personalization', severity: Math.ceil(Math.random() * 2) + 2, label: 'Personalization' })
  }
  if (lower.includes('will never') || lower.includes("won't work") || lower.includes("going to fail") || lower.includes('gonna be bad')) {
    distortions.push({ key: 'fortune_telling', severity: Math.ceil(Math.random() * 2) + 2, label: 'Fortune Telling' })
  }
  if (lower.includes('should') || lower.includes('must') || lower.includes('have to') || lower.includes("supposed to")) {
    distortions.push({ key: 'should_statements', severity: Math.ceil(Math.random() * 2) + 1, label: 'Should Statements' })
  }
  if (lower.includes('feel like') || (lower.includes('feel') && lower.includes('means')) || lower.includes('my anxiety means')) {
    distortions.push({ key: 'emotional_reasoning', severity: Math.ceil(Math.random() * 2) + 1, label: 'Emotional Reasoning' })
  }
  if (lower.includes("i'm a") || lower.includes("i am a") || lower.includes("such a") || lower.includes("i'm just an idiot")) {
    distortions.push({ key: 'labeling', severity: Math.ceil(Math.random() * 2) + 1, label: 'Labeling' })
  }
  if (lower.includes("only because") || lower.includes("was just luck") || lower.includes("anyone could")) {
    distortions.push({ key: 'discounting_positives', severity: Math.ceil(Math.random() * 2) + 1, label: 'Discounting Positives' })
  }
  if (lower.includes("not fair") || lower.includes("why me") || lower.includes("shouldn't happen to me")) {
    distortions.push({ key: 'fallacy_of_fairness', severity: Math.ceil(Math.random() * 2) + 1, label: 'Fallacy of Fairness' })
  }
  if (lower.includes("if i can't") || lower.includes("perfect or") || lower.includes("need to be right")) {
    distortions.push({ key: 'perfectionism', severity: Math.ceil(Math.random() * 2) + 1, label: 'Perfectionism' })
  }
  if (lower.includes("nothing i can do") || lower.includes("pointless") || lower.includes("out of my hands")) {
    distortions.push({ key: 'learned_helplessness', severity: Math.ceil(Math.random() * 2) + 2, label: 'Learned Helplessness' })
  }
  if (lower.includes("they're trying to") || lower.includes("everyone is out to") || lower.includes("doing this on purpose")) {
    distortions.push({ key: 'hostile_attribution_bias', severity: Math.ceil(Math.random() * 2) + 2, label: 'Hostile Attribution Bias' })
  }
  if (lower.includes("the real problem is") || lower.includes("it's actually their fault")) {
    distortions.push({ key: 'externalizing_blame', severity: Math.ceil(Math.random() * 2) + 1, label: 'Externalizing Blame' })
  }
  if (lower.includes("need them to like me") || lower.includes("if they reject me") || lower.includes("can't handle them being mad")) {
    distortions.push({ key: 'approval_seeking', severity: Math.ceil(Math.random() * 2) + 2, label: 'Approval Seeking' })
  }

  return distortions
}

export const detectAvoidance = (text) => {
  const lower = text.toLowerCase()
  const signals = []

  if (lower.includes("i don't know") || lower.includes("i'm not sure") || lower.includes("maybe")) {
    signals.push({ type: 'deflection', phrase: text.substring(0, 40) })
  }
  if ((lower.match(/sorry/g) || []).length >= 2) {
    signals.push({ type: 'over_apologizing', phrase: text.substring(0, 40) })
  }
  if (text.length < 15) {
    signals.push({ type: 'minimal_response', phrase: text })
  }

  return signals
}
