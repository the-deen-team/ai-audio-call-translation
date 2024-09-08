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
import { Box, Typography, IconButton, Button, TextField } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function Call() {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recorderRef = useRef(null);
  const audioBufferTimeoutRef = useRef(null);
  const callInputRef = useRef(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
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
        console.log("Audio chunk size:", event.data.size);
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
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average);

      requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
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
    <Box
      display="flex"
      flexDirection="column"
      width="100vw"
      height="100vh"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="h4">Audio Call Preview</Typography>

      <Box mt={2} display="flex" alignItems="center">
        <IconButton
          color={micEnabled ? "primary" : "secondary"}
          onClick={toggleMic}
        >
          {micEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton
          color={audioEnabled ? "primary" : "secondary"}
          onClick={toggleAudio}
        >
          {audioEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>

        <Box
          width="100px"
          height="10px"
          ml={2}
          bgcolor="gray"
          position="relative"
          overflow="hidden"
        >
          <Box
            width={`${audioLevel}%`}
            height="100%"
            bgcolor="green"
            position="absolute"
            top="0"
            left="0"
          />
        </Box>
      </Box>
      
      {isRecording && (
        <Typography variant="h6" mt={2}>
          Call Duration: {Math.floor(callDuration / 60)}:
          {callDuration % 60 < 10 ? "0" : ""}
          {callDuration % 60} minutes
        </Typography>
      )}

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        mt={3}
        gap={3}
      >
        <Button variant="contained" color="primary" onClick={createOffer}>
          Create Call
        </Button>
        <TextField inputRef={callInputRef} placeholder="Enter Call ID" />
        <Button variant="contained" color="primary" onClick={answerCall}>
          Answer Call
        </Button>
      </Box>

      {callCreated && (
        <Box
          mt={4}
          display="flex"
          flexDirection="column"
          alignItems="center"
          border="1px solid #ccc"
          borderRadius="8px"
          padding="20px"
          bgcolor="#f9f9f9"
        >
          <Typography variant="h6">Call ID</Typography>
          <Typography variant="subtitle1" mt={2} mb={2}>
            {callId}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ContentCopyIcon />}
            onClick={copyToClipboard}
          >
            Copy to Clipboard
          </Button>
        </Box>
      )}

      <audio ref={remoteAudioRef} autoPlay />
    </Box>
  );
}
