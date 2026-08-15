// Calculates whether a user is ready to level up a scenario
// based on their performance in the previous level.

export function evaluateCompetency(sessionReport) {
  const {
    assertiveness_score = 0,
    total_distortions = 0,
    avoidance_events = [],
    session_duration_minutes = 0,
    difficulty = 1,
  } = sessionReport

  // Criteria for "passing" a difficulty level:
  // 1. Assertiveness must be >= 6/10
  // 2. Distortions must be low relative to duration (< 1 per min)
  // 3. Avoidance events must be minimal (<= 1)
  
  const assertivenessPass = assertiveness_score >= 6
  const distortionPass = total_distortions <= (session_duration_minutes * 1.5)
  const avoidancePass = avoidance_events.length <= 1

  const isReadyForNextLevel = assertivenessPass && distortionPass && avoidancePass

  let reason
  if (isReadyForNextLevel) {
    reason = `You held your ground (Assertiveness: ${assertiveness_score}/10) and managed cognitive distortions well. You are ready for Level ${Math.min(difficulty + 1, 5)}.`
  } else {
    const blockers = []
    if (!assertivenessPass) blockers.push(`Assertiveness was ${assertiveness_score}/10 (need 6+)`)
    if (!distortionPass) blockers.push(`Distortions were frequent (${total_distortions} detected)`)
    if (!avoidancePass) blockers.push(`Avoidance patterns detected (${avoidance_events.length} times)`)
    
    reason = `Keep practicing at this level to build tolerance. Areas to focus on: ${blockers.join(', ')}.`
  }

  return {
    isReadyForNextLevel,
    recommendedLevel: isReadyForNextLevel ? Math.min(difficulty + 1, 5) : difficulty,
    reason,
    metrics: { assertivenessPass, distortionPass, avoidancePass }
  }
}

// Determines the maximum unlocked level for a scenario given the user's progress history
export function getMaxUnlockedLevel(scenarioId, sessionHistory) {
  // Overridden: Levels are no longer locked based on progression.
  // Users can pick and choose any difficulty level up to 5.
  return 5;
}
