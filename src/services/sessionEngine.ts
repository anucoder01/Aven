import { characters } from '../data/characterLibrary';

export interface Message {
  role: string;
  text?: string;
  content?: string;
}

// A simple bag-of-words cosine similarity for the prototype
function computeCosineSimilarity(strA: string, strB: string): number {
  const getWords = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const wordsA = getWords(strA);
  const wordsB = getWords(strB);
  
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const wordCountA: Record<string, number> = {};
  const wordCountB: Record<string, number> = {};
  const vocabulary = new Set<string>();

  for (const w of wordsA) {
    wordCountA[w] = (wordCountA[w] || 0) + 1;
    vocabulary.add(w);
  }
  for (const w of wordsB) {
    wordCountB[w] = (wordCountB[w] || 0) + 1;
    vocabulary.add(w);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const word of vocabulary) {
    const valA = wordCountA[word] || 0;
    const valB = wordCountB[word] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const sessionEngine = {
  getResponseMapGuidance(characterId: string, userMessage: string): string | null {
    const character = characters.find(c => c.id === characterId);
    if (!character || !character.responseMap) return null;

    const lowerMessage = userMessage.toLowerCase();
    
    // Very basic heuristic match: check if trigger words appear in user message
    for (const [trigger, behavior] of Object.entries(character.responseMap)) {
      const triggerWords = trigger.toLowerCase().split(' ');
      const matchScore = triggerWords.filter(word => lowerMessage.includes(word)).length / triggerWords.length;
      
      // If a significant portion of trigger words are present
      if (matchScore > 0.5) {
        return `GUIDANCE: The user appears to be [${trigger}]. Your response should [${behavior}]. Do not copy this verbatim — use it as direction only.`;
      }
    }
    
    return null;
  },

  buildSystemPrompt(
    characterId: string,
    difficultyLevel: 1 | 2 | 3 | 4 | 5,
    conversationHistory: Message[],
    userMessage: string,
    isReversal: boolean = false
  ): string {
    const character = characters.find(c => c.id === characterId);
    if (!character) throw new Error(`Character ${characterId} not found`);

    const levelObj = character.levels.find(l => l.level === difficultyLevel) || character.levels[0];
    
    // Extract last 6 exchanges and summarize them briefly
    const lastSix = conversationHistory.slice(-6);
    const historyText = lastSix.map(m => `${m.role.toUpperCase()}: ${m.content || m.text}`).join(' | ');
    const historySummary = historyText ? historyText.substring(0, 500) : "No history yet.";

    let prompt = character.systemPrompt;
    
    if (isReversal) {
      prompt = `ROLE REVERSAL MODE: The human user is playing the role of ${character.name}, who is: ${character.identity}. You, the AI, are playing the role of the User (a healthy, assertive individual setting boundaries). Model ideal communication, emotional regulation, and cognitive flexibility. Do not fall into the traps of the antagonist. \n\nAntagonist prompt context (for your reference on how they might act): ${prompt}`;
    }

    // Replace template variables
    prompt = prompt.replace('{user_message}', userMessage);
    prompt = prompt.replace('{history}', historySummary);
    prompt = prompt.replace('{level}', `L${difficultyLevel}`);
    prompt = prompt.replace('{level_desc}', levelObj.label);

    const guidance = this.getResponseMapGuidance(characterId, userMessage);
    if (guidance && !isReversal) {
      prompt += `\n\n${guidance}`;
    }

    return prompt;
  },

  async validateResponse(
    userMessage: string,
    characterResponse: string,
    embeddingModel: any = null // Not used strictly in mock
  ): Promise<boolean> {
    const similarity = computeCosineSimilarity(userMessage, characterResponse);
    // As per prompt: If similarity < 0.12: flag as generic
    if (similarity < 0.12) {
      console.warn(`Response flagged as generic (similarity: ${similarity.toFixed(3)}).`);
      return false;
    }
    return true;
  }
};
