/**
 * ttsEngine.js — free, unlimited, zero-setup character voice.
 * Uses the browser's native SpeechSynthesis API. No API key, no backend
 * call, no cost. Quality is more robotic than ElevenLabs but reliable
 * and works fully offline once the page is loaded.
 *
 * Browser support: Chrome, Edge, Safari all support this well. Firefox
 * support is present but voice list can be sparser -- recommend
 * demoing on Chrome/Edge for best voice quality.
 */

let cachedVoices = [];
let voicesLoaded = false;

function loadVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      voicesLoaded = true;
      resolve(voices);
      return;
    }
    // Voices load asynchronously on first call in some browsers.
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(cachedVoices);
    };
  });
}

/**
 * Picks a reasonable default voice: prefers an English voice, and
 * prefers non-"local"/novelty voices where the browser exposes better
 * "Natural"/"Enhanced" options (Chrome/Edge label these distinctly).
 */
function pickDefaultVoice(voices, preferredLang = "en-US") {
  if (!voices.length) return null;
  const enhanced = voices.find(
    (v) => v.lang.startsWith("en") && /natural|enhanced|premium/i.test(v.name)
  );
  if (enhanced) return enhanced;
  const exactLang = voices.find((v) => v.lang === preferredLang);
  if (exactLang) return exactLang;
  const anyEnglish = voices.find((v) => v.lang.startsWith("en"));
  return anyEnglish || voices[0];
}

/**
 * Speaks the given text aloud. Returns a promise that resolves when
 * speech finishes (or rejects on error), so callers can await it to
 * sequence "character finishes speaking, then re-enable mic input".
 */
export async function speak(text, { voiceName = null, rate = 1.0, pitch = 1.0 } = {}) {
  if (!("speechSynthesis" in window)) {
    console.warn("SpeechSynthesis not supported in this browser.");
    return Promise.resolve();
  }

  if (!voicesLoaded) {
    await loadVoices();
  }

  return new Promise((resolve, reject) => {
    // Cancel any in-progress speech before starting new speech --
    // prevents overlapping/queued utterances if the user interrupts.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voiceName
      ? cachedVoices.find((v) => v.name === voiceName)
      : pickDefaultVoice(cachedVoices);

    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export async function getAvailableVoices() {
  if (!voicesLoaded) {
    await loadVoices();
  }
  return cachedVoices.filter((v) => v.lang.startsWith("en"));
}

/**
 * Usage in SessionPage.jsx, after receiving a full character response
 * (or per-sentence, for lower perceived latency):
 *
 *   import { speak } from '../services/ttsEngine'
 *   ...
 *   if (voiceModeEnabled) {
 *     await speak(characterResponseText, { rate: 1.0 })
 *   }
 */
