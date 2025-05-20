// aiAvatar.js
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');
const hf = new HfInference(process.env.HF_API_TOKEN); 

    const system =`You are a seed+options generator for DiceBear avatars.
    Given the user’s description, output only valid JSON—no markdown, no backticks, no comments.
Your JSON object must have these keys:
"seed": a hyphenated string of two words + two digits,
"backgroundColor": 6-digit hex string,
"hairColor": 6-digit hex string,
"accessoriesProbability": integer 0–100
Example:
{"seed":"sunset-skater-42","backgroundColor":"ffcc00","hairColor":"663399","accessoriesProbability":65}
`.trim();

async function describeForDiceBear(userPrompt) {
  const response = await hf.chatCompletion({
    model: 'microsoft/phi-4',
    messages: [
      { role: 'system', content: system },
      { 
        role: 'user', 
        content: `Description: "${userPrompt}"`  
      }
    ],
    temperature: 0.9,
    max_tokens: 50
  });
  
  let content = response.choices[0].message.content.trim();
  content = content.replace(/```(?:json)?/g, '').trim();
  let obj;
  try {
    obj = JSON.parse(content);
  } catch {
    throw new Error('Seed generator returned invalid JSON: ' + content);
  }
  return obj;  // { seed, backgroundColor, hairColor, accessoriesProbability }
}

module.exports = { describeForDiceBear };
