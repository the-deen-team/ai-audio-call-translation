"use client";
import { useEffect, useRef, useState } from "react";
import { firestore } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Mic, MicOff, VolumeUp, VolumeOff, ContentCopy } from "@mui/icons-material"; // Correctly importing icons

export default function Call() {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recorderRef = useRef(null);
  const callInputRef = useRef(null);
  const canvasRef = useRef(null); // Canvas for audio waveform
  const analyserRef = useRef(null); // Analyser for waveform

  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callId, setCallId] = useState("");
  const [callCreated, setCallCreated] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      remoteStreamRef.current = new MediaStream();
    }

    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    peerConnectionRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
    };

    return () => {
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, []);

  const startAudio = async () => {
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      console.log("Audio stream started successfully");
      monitorAudioLevel();
      recordAudio();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const recordAudio = () => {
    recorderRef.current = new MediaRecorder(localStreamRef.current, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 48000,
    });

    recorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        sendAudioToAPI(audioChunksRef.current);
      }
    };

    recorderRef.current.start(1000);
  };

  const sendAudioToAPI = async (audioChunks) => {
    if (audioChunks.length === 0) {
      console.error("No audio data to send");
      return;
    }

    const blob = new Blob(audioChunks, { type: "audio/webm" });
    const audioBuffer = await blob.arrayBuffer();

    console.log("Sending audio to API, buffer size:", audioBuffer.byteLength);

    try {
      const response = await fetch("/api/listen", {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: audioBuffer,
      });

      const { transcription } = await response.json();
      console.log(
        "Transcription received:",
        transcription || "No transcription available"
      );
    } catch (error) {
      console.error("Error sending audio to API:", error);
    }
  };

  const monitorAudioLevel = () => {
    console.log("Monitoring and updating audio levels...");
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyserRef.current = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    source.connect(analyserRef.current);

    analyserRef.current.fftSize = 2048;
    drawWaveform();
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);

      canvasContext.lineWidth = 2;
      canvasContext.strokeStyle = "#4caf50"; // Green color for the waveform

      canvasContext.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasContext.moveTo(x, y);
        } else {
          canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasContext.lineTo(canvas.width, canvas.height / 2);
      canvasContext.stroke();

      requestAnimationFrame(draw);
    };

    draw();
  };

  const createOffer = async () => {
    await startAudio();

    const callDocRef = doc(collection(firestore, "calls"));
    const offerCandidates = collection(callDocRef, "offerCandidates");
    const answerCandidates = collection(callDocRef, "answerCandidates");

    setCallId(callDocRef.id);
    setCallCreated(true);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDocRef, { offer });

    onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnectionRef.current.setRemoteDescription(answerDescription);
      }
    });

    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnectionRef.current.addIceCandidate(candidate);
        }
      });
    });
  };

  const answerCall = async () => {
    const callId = callInputRef.current.value;

    await startAudio();

    const callDocRef = doc(firestore, "calls", callId);
    const offerCandidates = collection(callDocRef, "offerCandidates");
    const answerCandidates = collection(callDocRef, "answerCandidates");

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const callData = (await getDoc(callDocRef)).data();
    const offerDescription = callData.offer;
    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );

    const answerDescription = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answerDescription);

    await updateDoc(callDocRef, { answer: answerDescription });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnectionRef.current.addIceCandidate(candidate);
        }
      });
    });
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  const toggleAudio = () => {
    const remoteAudioTrack = peerConnectionRef.current
      .getReceivers()
      .find((receiver) => receiver.track.kind === "audio")?.track;
    if (remoteAudioTrack) {
      remoteAudioTrack.enabled = !remoteAudioTrack.enabled;
      setAudioEnabled(remoteAudioTrack.enabled);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(callId);
  };

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Audio Call Preview</h1>

      <div className="flex items-center mb-4">
        <button
          className={`p-2 rounded-full ${
            micEnabled ? "bg-blue-500" : "bg-red-500"
          }`}
          onClick={toggleMic}
        >
          {micEnabled ? <Mic className="text-white" /> : <MicOff className="text-white" />}
        </button>
        <button
          className={`p-2 rounded-full ml-4 ${
            audioEnabled ? "bg-blue-500" : "bg-red-500"
          }`}
          onClick={toggleAudio}
        >
          {audioEnabled ? (
            <VolumeUp className="text-white" />
          ) : (
            <VolumeOff className="text-white" />
          )}
        </button>
      </div>

      {/* Canvas for the audio waveform */}
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="border border-gray-300 rounded mb-4"
      />

      {isRecording && (
        <h2 className="text-xl font-semibold">
          Call Duration: {Math.floor(callDuration / 60)}:
          {callDuration % 60 < 10 ? "0" : ""}
          {callDuration % 60} minutes
        </h2>
      )}

      <div className="flex flex-col items-center mt-4 space-y-4">
        <button
          className="bg-blue-500 text-white py-2 px-6 rounded-lg"
          onClick={createOffer}
        >
          Create Call
        </button>
        <input
          ref={callInputRef}
          placeholder="Enter Call ID"
          className="border border-gray-300 p-2 rounded-lg w-64"
        />
        <button
          className="bg-blue-500 text-white py-2 px-6 rounded-lg"
          onClick={answerCall}
        >
          Answer Call
        </button>
      </div>

      {callCreated && (
        <div className="mt-8 p-4 border border-gray-300 rounded-lg bg-gray-100">
          <h2 className="text-lg font-semibold">Call ID</h2>
          <p className="mt-2 mb-4">{callId}</p>
          <button
            className="bg-white text-blue-500 border border-blue-500 px-4 py-2 rounded-lg flex items-center"
            onClick={copyToClipboard}
          >
            <ContentCopy className="mr-2" />
            Copy to Clipboard
          </button>
        </div>
      )}

      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
