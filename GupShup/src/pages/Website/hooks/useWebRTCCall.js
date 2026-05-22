import { useCallback, useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

export function useWebRTCCall(socket, myUserId) {
  const [callState, setCallState] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);       // stable ref so closures always get live socket
  const pendingCandidates = useRef([]);

  // DOM element refs – stable objects, never reassigned
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Keep socketRef in sync with the socket state value
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // ── Attach streams to DOM elements whenever stream or ref changes ──────────
  // We use refs for the DOM elements and store streams in state.
  // The attachments run after every render where the stream has a value.

  const attachLocalStream = useCallback((stream) => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const attachRemoteStream = useCallback((stream) => {
    if (remoteVideoRef.current && stream) {
      remoteVideoRef.current.srcObject = stream;
    }
    if (remoteAudioRef.current && stream) {
      remoteAudioRef.current.srcObject = stream;
    }
  }, []);

  useEffect(() => { attachLocalStream(localStream); }, [localStream, attachLocalStream]);
  useEffect(() => { attachRemoteStream(remoteStream); }, [remoteStream, attachRemoteStream]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidates.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  const endCall = useCallback((remoteUserId) => {
    const sock = socketRef.current;
    if (sock && remoteUserId) sock.emit("call:end", { targetUserId: remoteUserId });
    cleanup();
    setCallState({ status: "ended" });
    setTimeout(() => setCallState(null), 1800);
  }, [cleanup]);

  // ── Create RTCPeerConnection ───────────────────────────────────────────────
  // Uses socketRef (stable) inside callbacks so they never go stale regardless
  // of when socket state changes.
  const createPeerConnection = useCallback((remoteUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit("call:ice-candidate", { targetUserId: remoteUserId, candidate });
      }
    };

    pc.ontrack = (event) => {
      // Prefer streams[0]; fall back to constructing a new stream from the track
      let stream = event.streams && event.streams[0];
      if (!stream) {
        stream = new MediaStream([event.track]);
      }
      console.log("[WebRTC] ontrack fired, stream tracks:", stream.getTracks().length);
      setRemoteStream(stream);
      // Direct assignment as belt-and-suspenders
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] connectionState:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallState((prev) => prev ? { ...prev, status: "active" } : prev);
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setCallState((prev) => prev ? { ...prev, status: "ended" } : prev);
        setTimeout(() => setCallState(null), 1800);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] iceConnectionState:", pc.iceConnectionState);
    };

    return pc;
  }, []); // ← no dependencies: uses socketRef internally (always up-to-date)

  // ── Outgoing call ──────────────────────────────────────────────────────────
  const startCall = useCallback(async ({ remoteUserId, remoteName, callType = "audio", myName = "You" }) => {
    const sock = socketRef.current;
    if (!sock || !remoteUserId) return;

    setCallState({ status: "calling", callType, remoteUserId, remoteName });

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    attachLocalStream(stream); // attach immediately without waiting for effect

    const pc = createPeerConnection(remoteUserId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sock.emit("call:offer", { targetUserId: remoteUserId, offer, callType, callerName: myName });
  }, [createPeerConnection, attachLocalStream]);

  // ── Accept incoming call ───────────────────────────────────────────────────
  const acceptCall = useCallback(async ({ fromUserId, offer, callType = "audio" }) => {
    const sock = socketRef.current;
    if (!sock) return;

    // Immediately flip UI so it doesn't appear frozen
    setCallState((prev) => ({ ...prev, status: "active" }));

    // Get media – fall back to audio-only if camera is busy (same-device testing)
    let stream;
    if (callType === "video") {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (videoErr) {
        console.warn("[WebRTC] Camera fallback to audio-only:", videoErr.name);
        const recoverable = ["NotReadableError", "NotAllowedError", "OverconstrainedError", "AbortError"];
        if (recoverable.includes(videoErr.name)) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } else {
          throw videoErr;
        }
      }
    } else {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    attachLocalStream(stream); // attach immediately

    const pc = createPeerConnection(fromUserId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Flush any ICE candidates that arrived before remote description was set
    for (const c of pendingCandidates.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch((e) => console.warn("[WebRTC] ICE flush error:", e));
    }
    pendingCandidates.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sock.emit("call:answer", { targetUserId: fromUserId, answer });
  }, [createPeerConnection, attachLocalStream]);

  // ── Reject incoming call ───────────────────────────────────────────────────
  const rejectCall = useCallback(({ fromUserId }) => {
    const sock = socketRef.current;
    if (sock && fromUserId) sock.emit("call:reject", { targetUserId: fromUserId });
    setCallState(null);
  }, []);

  // ── Socket event listeners ─────────────────────────────────────────────────
  // Only registers once `socket` becomes non-null.
  useEffect(() => {
    if (!socket) return;

    const onIncoming = ({ fromUserId, callerName, callType, offer }) => {
      console.log("[WebRTC] call:incoming from", fromUserId);
      setCallState({
        status: "incoming",
        callType: callType || "audio",
        remoteUserId: fromUserId,
        remoteName: callerName || "Someone",
        incomingOffer: offer,
      });
    };

    const onAnswered = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        console.log("[WebRTC] call:answered – setting remote description");
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        for (const c of pendingCandidates.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch((e) => console.warn("[WebRTC] ICE flush:", e));
        }
        pendingCandidates.current = [];
        setCallState((prev) => prev ? { ...prev, status: "active" } : prev);
      } catch (err) {
        console.error("[WebRTC] call:answered error:", err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc || !candidate) return;
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (e) {
        console.warn("[WebRTC] addIceCandidate error:", e);
      }
    };

    const onEnded = () => {
      console.log("[WebRTC] call:ended");
      cleanup();
      setCallState({ status: "ended" });
      setTimeout(() => setCallState(null), 1800);
    };

    const onRejected = () => {
      console.log("[WebRTC] call:rejected");
      cleanup();
      setCallState({ status: "ended" });
      setTimeout(() => setCallState(null), 1800);
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:answered", onAnswered);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:ended", onEnded);
    socket.on("call:rejected", onRejected);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:answered", onAnswered);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:ended", onEnded);
      socket.off("call:rejected", onRejected);
    };
  }, [socket, cleanup]);

  return {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    localStream,
    remoteStream,
  };
}
