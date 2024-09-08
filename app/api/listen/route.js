import { SpeechClient } from "@google-cloud/speech";
import { NextResponse } from "next/server";

// Initialize the Google Cloud Speech client
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
    // Create the audio stream for streamingRecognize
    const audioStream = req.body;

    // Speech-to-Text streaming recognition config
    const request = {
      config: {
        encoding: "WEBM_OPUS",
        sampleRateHertz: 48000,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
      },
      interimResults: false, // If you want interim results, set this to true
    };

    // Create the recognize stream
    const recognizeStream = speechClient
      .streamingRecognize(request)
      .on("error", (error) => {
        console.error("Speech-to-Text error:", error);
      })
      .on("data", (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcription = data.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");

          console.log("Transcription:", transcription);
        } else {
          console.log("No transcription available");
        }
      });

    // Send the audio data to the Google API
    for await (const chunk of audioStream) {
      recognizeStream.write(chunk);
    }

    // End the stream when all the audio has been sent
    recognizeStream.end();

    return NextResponse.json({ message: "Audio sent successfully" });
  } catch (error) {
    console.error("Streaming recognize error:", error);
    return NextResponse.json({ error: "Speech-to-Text streaming failed" });
  }
}
