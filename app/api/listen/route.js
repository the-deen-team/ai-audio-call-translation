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

    // Get MIME type from the request headers
    const contentType = req.headers.get("content-type") || "";
    console.log("contentType", contentType);
    let encoding;

    // Dynamically choose the encoding based on the content type
    if (contentType.includes("audio/webm")) {
      encoding = "WEBM_OPUS";
    } else if (contentType.includes("audio/ogg")) {
      encoding = "OGG_OPUS";
    } else if (contentType.includes("audio/mp4")) {
      encoding = "MP4";
    } else {
      console.error("Unsupported audio format");
      return NextResponse.json({ error: "Unsupported audio format" });
    }

    console.log("encoding", encoding);
    const audio = {
      content: audioBytes,
    };

    const config = {
      encoding: encoding,
      sampleRateHertz: 48000, // Adjust sample rate if necessary
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
    };

    const request = {
      audio,
      config,
    };

    console.log("Sending audio to Speech-to-Text API...");
    const [response] = await speechClient.recognize(request);

    if (response.results.length === 0) {
      console.log("No transcription available");
      return NextResponse.json({ transcription: "No transcription available" });
    }

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
