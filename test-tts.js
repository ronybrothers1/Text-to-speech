const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function run() {
  try {
    fs.writeFileSync('output2.log', 'Starting...\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: "Halo apa kabar?" }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    fs.appendFileSync('output2.log', 'Done generating!\n');
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    fs.appendFileSync('output2.log', 'Audio length: ' + (base64Audio ? base64Audio.length : 0));
  } catch (error) {
    fs.appendFileSync('output2.log', 'ERROR: ' + error.message + '\n');
  }
}

run();
