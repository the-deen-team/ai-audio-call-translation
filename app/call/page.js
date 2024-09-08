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
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Navbar from "@/components/Navbar"; // Import the Navbar component

export default function Call() {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const remoteAudioRef = useRef(null); // Ref for the remote audio element
  const callInputRef = useRef(null);
  const canvasRef = useRef(null); // Ref for the audio waveform canvas
  const analyserRef = useRef(null); // Ref for the audio analyser node

  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callId, setCallId] = useState(""); // State to store the call ID
  const [callCreated, setCallCreated] = useState(false); // To display the ID box

  useEffect(() => {
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

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(
        localStreamRef.current
      );
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 2048;
      drawWaveform();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
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
      canvasContext.strokeStyle = "#4caf50";

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

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Include Navbar */}
      <Navbar />

      <div className="flex flex-col items-center justify-center w-full h-full p-4">
        <h1 className="text-3xl font-bold text-black">Call with Ismail</h1>

        <div className="flex items-center mt-4 space-x-4">
          <button
            className={`p-2 rounded-full ${
              micEnabled ? "bg-blue-500" : "bg-red-500"
            }`}
            onClick={toggleMic}
          >
            {micEnabled ? <MicIcon className="text-white" /> : <MicOffIcon className="text-white" />}
          </button>
          <button
            className={`p-2 rounded-full ${
              audioEnabled ? "bg-blue-500" : "bg-red-500"
            }`}
            onClick={toggleAudio}
          >
            {audioEnabled ? (
              <VolumeUpIcon className="text-white" />
            ) : (
              <VolumeOffIcon className="text-white" />
            )}
          </button>
        </div>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          width={300}
          height={100}
          className="border border-gray-300 rounded mt-6"
        />

        <div className="flex flex-col items-center justify-center mt-6 space-y-4">
          <button
            className="bg-blue-500 text-white py-2 px-6 rounded-lg"
            onClick={createOffer}
          >
            Create Call
          </button>
          <input
            ref={callInputRef}
            placeholder="Enter Call ID"
            className="border border-gray-300 p-2 rounded-lg w-64 bg-white text-black"
          />
          <button
            className="bg-blue-500 text-white py-2 px-6 rounded-lg"
            onClick={answerCall}
          >
            Answer Call
          </button>
        </div>

        {callCreated && (
          <div className="flex flex-col items-center justify-center mt-8 p-4 border border-gray-300 rounded-lg bg-gray-100">
            <h2 className="text-lg font-semibold">Call ID</h2>
            <p className="mt-2 mb-4 text-gray-700">{callId}</p>
            <button
              className="bg-white text-blue-500 border border-blue-500 px-4 py-2 rounded-lg flex items-center space-x-2"
              onClick={copyToClipboard}
            >
              <ContentCopyIcon />
              <span>Copy to Clipboard</span>
            </button>
          </div>
        )}

        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
}
