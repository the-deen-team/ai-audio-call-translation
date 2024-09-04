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
  const remoteStreamRef = useRef(new MediaStream());
  const remoteAudioRef = useRef(null); // Ref for the remote audio element
  const callInputRef = useRef(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [callId, setCallId] = useState(""); // State to store the call ID
  const [callCreated, setCallCreated] = useState(false); // To display the ID box

  useEffect(() => {
    // Initialize PeerConnection
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    // Handle remote audio stream and attach it to the <audio> element
    peerConnectionRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play(); // Autoplay the remote audio
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

      // Add local audio track to the peer connection
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      // Monitor audio levels
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(
        localStreamRef.current
      );
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
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const createOffer = async () => {
    await startAudio();

    // Create a new document in the "calls" collection
    const callDocRef = doc(collection(firestore, "calls")); // Automatically generate a new document with an ID
    const offerCandidates = collection(callDocRef, "offerCandidates");
    const answerCandidates = collection(callDocRef, "answerCandidates");

    setCallId(callDocRef.id); // Store the call ID in state
    setCallCreated(true); // Show the call ID box

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON()); // Add ICE candidate to offerCandidates subcollection
      }
    };

    const offerDescription = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // Set the offer in Firestore under the same call document
    await setDoc(callDocRef, { offer });

    // Listen for the answer
    onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnectionRef.current.setRemoteDescription(answerDescription);
      }
    });

    // Listen for answer candidates
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

    // Reference the existing document in the "calls" collection using the callId
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

    // Listen for offer candidates
    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnectionRef.current.addIceCandidate(candidate);
        }
      });
    });
  };

  // Toggle microphone
  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  // Toggle remote audio
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

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100vw"
      height="100vh"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="h4">Audio Call</Typography>

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
