import { SpeechClient } from "@google-cloud/speech";
import { NextResponse } from "next/server";

const speechClient = new SpeechClient({
  timeout: 10000,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const chunks = [];

    for await (const chunk of req.body) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);

    console.log("Audio buffer size:", audioBuffer.length);

    const audioBytes = audioBuffer.toString("base64");

    const audio = {
      content: audioBytes,
    };

    const config = {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
    };

    const request = {
      audio,
      config,
    };

    console.log("Sending audio to Speech-to-Text API...");
    const [response] = await speechClient.recognize(request);

    console.log("Response received:", response);

    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");

    console.log("Transcription:", transcription);

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error("Speech-to-Text error:", error);
    return NextResponse.json({ error: "Speech-to-Text failed" });
  }
}
