import React, { useEffect, useRef, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { toaster } from "./ui/toaster";
import { formatDuration } from "../config/ChatLogics";

const MAX_SECONDS = 120;

// pick a format this browser can record (Chrome/Firefox: webm, Safari: mp4)
const pickMimeType = () =>
  ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
    (t) => window.MediaRecorder?.isTypeSupported?.(t),
  ) || "";

// replaces the input bar while recording; starts as soon as it appears
const VoiceRecorder = ({ onSend, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const sendOnStopRef = useRef(false);
  const startedAtRef = useRef(0);
  // keep the latest callbacks without restarting the recording
  const onSendRef = useRef(onSend);
  const onCancelRef = useRef(onCancel);
  onSendRef.current = onSend;
  onCancelRef.current = onCancel;

  const finish = (send) => {
    sendOnStopRef.current = send;
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") recorder.stop();
    else if (!send) onCancelRef.current();
  };

  useEffect(() => {
    let stream;
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toaster.create({ description: "This browser can't record audio", type: "error" });
      onCancelRef.current();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        stream = s;
        if (cancelled) return s.getTracks().forEach((t) => t.stop());

        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(s, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
        recorder.onstop = () => {
          s.getTracks().forEach((t) => t.stop());
          if (!sendOnStopRef.current) return onCancelRef.current();
          const type = recorder.mimeType || "audio/webm";
          const ext = type.includes("mp4") ? "m4a" : "webm";
          const file = new File(chunksRef.current, `voice-note.${ext}`, { type });
          const duration = (Date.now() - startedAtRef.current) / 1000;
          onSendRef.current(file, duration);
        };
        recorder.start();
        startedAtRef.current = Date.now();
        recorderRef.current = recorder;
      })
      .catch(() => {
        toaster.create({
          description: "Microphone access was blocked. Allow it in your browser to send voice notes.",
          type: "error",
        });
        onCancelRef.current();
      });

    const timer = setInterval(() => {
      if (!startedAtRef.current) return;
      const s = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setSeconds(s);
      if (s >= MAX_SECONDS) finish(true);
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(timer);
      const recorder = recorderRef.current;
      if (recorder && recorder.state === "recording") {
        sendOnStopRef.current = false;
        recorder.stop();
      }
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <Box
      className="babble-pop"
      flex="1"
      display="flex"
      alignItems="center"
      gap={3}
      h="48px"
      px={2}
      borderRadius="full"
      bg="rgba(239,68,68,0.12)"
      border="1px solid rgba(239,68,68,0.35)"
    >
      <Box
        as="button"
        type="button"
        onClick={() => finish(false)}
        aria-label="Cancel recording"
        w="36px"
        h="36px"
        borderRadius="full"
        color="#FCA5A5"
        _hover={{ bg: "rgba(239,68,68,0.2)" }}
      >
        <i className="fa-solid fa-trash" />
      </Box>

      <Box className="babble-pulse" w="10px" h="10px" borderRadius="full" bg="#ef4444" />
      <Text fontWeight="600" color="white" fontVariantNumeric="tabular-nums">
        {formatDuration(seconds)}
      </Text>
      <Text fontSize="sm" color="gray.400" flex="1" truncate>
        Recording… (max {MAX_SECONDS / 60} min)
      </Text>

      <Box
        as="button"
        type="button"
        onClick={() => finish(true)}
        aria-label="Send voice note"
        w="40px"
        h="40px"
        borderRadius="full"
        bg="var(--gradient)"
        color="white"
        transition="transform 0.15s"
        _hover={{ transform: "scale(1.08)" }}
      >
        <i className="fa-solid fa-paper-plane" />
      </Box>
    </Box>
  );
};

export default VoiceRecorder;
