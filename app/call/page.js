"use client";
import { Box, Typography, IconButton, Button } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const NGROK_URL = "https://0200-2603-8000-5700-29d-5d61-8878-cc33-4c9.ngrok-free.app";

export default function Call() {
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioLevelRef = useRef(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    // Initialize socket connection using ngrok URL
    socketRef.current = io(NGROK_URL, {
      path: "/api/signal/socket.io", // Ensure this matches your server's socket.io path
    });

    // Setup WebRTC
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Get user media (audio only)
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        stream
          .getTracks()
          .forEach((track) =>
            peerConnectionRef.current.addTrack(track, stream)
          );

        // Setup audio level monitoring
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
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
      })
      .catch((error) => console.error("Error accessing media devices.", error));

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", event.candidate);
      }
    };

    // Handle incoming ICE candidates
    socketRef.current.on("ice-candidate", (candidate) => {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Handle remote audio stream
    peerConnectionRef.current.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
    };

    // Handle offer
    socketRef.current.on("offer", async (offer) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socketRef.current.emit("answer", answer);
    });

    // Handle answer
    socketRef.current.on("answer", async (answer) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Toggle microphone
  const toggleMic = () => {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    const remoteAudioTrack = peerConnectionRef.current
      .getReceivers()
      .find((receiver) => receiver.track.kind === "audio")?.track;
    if (remoteAudioTrack) {
      remoteAudioTrack.enabled = !remoteAudioTrack.enabled;
      setAudioEnabled(remoteAudioTrack.enabled);
    }
  };

  // Create offer
  const createOffer = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socketRef.current.emit("offer", offer);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100vw"
      height="100vh"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="h4">Call Preview</Typography>

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
          ref={audioLevelRef}
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

      <Button
        variant="contained"
        color="primary"
        onClick={createOffer}
        style={{ marginTop: "20px" }}
      >
        Start Call
      </Button>
    </Box>
  );
}
