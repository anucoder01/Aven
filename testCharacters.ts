import { sessionEngine } from './src/services/sessionEngine';
import { characters } from './src/data/characterLibrary';

async function runTests() {
  let passed = true;
  for (const c of characters) {
    const keys = Object.keys(c.responseMap);
    for (const key of keys) {
      const guidance = sessionEngine.getResponseMapGuidance(c.id, key);
      if (!guidance) {
        console.log(`Failed to generate guidance for: ${c.name} on trigger: ${key}`);
        passed = false;
      }
    }
  }
  
  if (passed) {
    console.log(`All ${characters.length} characters successfully map triggers to context-aware guidance!`);
  }
}

runTests().catch(console.error);
