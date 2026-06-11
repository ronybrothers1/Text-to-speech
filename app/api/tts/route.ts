import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Kunci API Gemini (GEMINI_API_KEY) belum diatur. Silakan tambahkan pada menu konfigurasi Secrets.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const { text, voice, style, speed, pitch, emotion } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Construct the prefix based on settings to guide the model's tone
    let stylePrefix = '';
    
    if (style || emotion || speed || pitch) {
        const modifiers = [];
        if (style) modifiers.push(`in a ${style} style`);
        if (emotion) modifiers.push(`with a ${emotion} tone`);
        if (speed) modifiers.push(`at a ${speed} pace`);
        if (pitch) modifiers.push(`with a ${pitch} pitch`);
        
        stylePrefix = `Say ${modifiers.join(', ')}: `;
    }

    const promptText = stylePrefix ? `${stylePrefix}${text}` : text;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      console.error('Model response did not contain inlineData. Full response:', JSON.stringify(response, null, 2));
      return NextResponse.json({ error: 'Model output invalid or missing audio data' }, { status: 500 });
    }

    return NextResponse.json({ audio: base64Audio });
  } catch (error: any) {
    console.error('TTS Generation Error Detail:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process TTS request' },
      { status: 500 }
    );
  }
}
