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
    fs.writeFileSync('output3.log', 'Starting...\n');
    const promptText = "Say in a Pembawa Berita Profesional style: Halo nama saya Budi";
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    fs.appendFileSync('output3.log', 'Done generating!\n');
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    fs.appendFileSync('output3.log', 'Audio length: ' + (base64Audio ? base64Audio.length : 0));
  } catch (error) {
    fs.appendFileSync('output3.log', 'ERROR: ' + error.message + '\n');
  }
}

run();
