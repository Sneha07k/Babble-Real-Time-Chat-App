import React, { useEffect, useRef, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { playableUrl } from "../config/upload";
import { formatDuration } from "../config/ChatLogics";

// Cloudinary resizes on request, so the chat loads a small copy of each photo
const thumbnail = (url) => url.replace("/upload/", "/upload/w_640,c_limit,q_auto,f_auto/");

// fake but stable waveform: the same voice note always draws the same bars
const barHeights = (seed) =>
  Array.from({ length: 28 }, (_, i) => {
    const n = Math.sin((seed.length + i * 7.3) * 12.9898) * 43758.5453;
    return 25 + Math.round((n - Math.floor(n)) * 75);
  });

const VoiceNote = ({ src, duration, mine }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const bars = barHeights(src);
  const total = duration || audioRef.current?.duration || 0;
  const progress = total ? current / total : 0;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  return (
    <Box display="flex" alignItems="center" gap={3} minW="220px" py={1}>
      <Box
        as="button"
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        w="38px"
        h="38px"
        flexShrink={0}
        borderRadius="full"
        bg={mine ? "white" : "var(--gradient)"}
        color={mine ? "var(--c1-strong)" : "white"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        transition="transform 0.15s"
        _hover={{ transform: "scale(1.08)" }}
      >
        <i className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`} />
      </Box>

      <Box flex="1" display="flex" alignItems="center" gap="2px" h="30px">
        {bars.map((h, i) => (
          <Box
            key={i}
            flex="1"
            h={`${h}%`}
            borderRadius="full"
            bg={i / bars.length <= progress ? "white" : "rgba(255,255,255,0.35)"}
            transition="background 0.1s"
          />
        ))}
      </Box>

      <Text fontSize="xs" color="rgba(255,255,255,0.8)" minW="32px" textAlign="right">
        {formatDuration(playing || current ? current : total)}
      </Text>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
      />
    </Box>
  );
};

// full-screen photo viewer; Esc or a click outside closes it
export const Lightbox = ({ url, onClose }) => {
  useEffect(() => {
    if (!url) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);

  if (!url) return null;
  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={3000}
      bg="rgba(5,3,15,0.92)"
      backdropFilter="blur(8px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      onClick={onClose}
    >
      <Box display="flex" gap={2} position="absolute" top={4} right={4}>
        <Box
          as="a"
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          w="42px"
          h="42px"
          borderRadius="full"
          bg="rgba(255,255,255,0.12)"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          aria-label="Open original"
        >
          <i className="fa-solid fa-up-right-from-square" />
        </Box>
        <Box
          as="button"
          type="button"
          onClick={onClose}
          w="42px"
          h="42px"
          borderRadius="full"
          bg="rgba(255,255,255,0.12)"
          color="white"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark" />
        </Box>
      </Box>
      <Box
        as="img"
        src={url}
        alt="Shared photo"
        className="babble-pop"
        maxW="100%"
        maxH="90vh"
        borderRadius="16px"
        boxShadow="0 20px 60px rgba(0,0,0,0.6)"
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

const MediaMessage = ({ attachment, mine, onOpenImage }) => {
  const { kind, url, width, height, duration } = attachment;

  if (kind === "image") {
    return (
      <Box
        as="img"
        src={thumbnail(url)}
        alt="Shared photo"
        loading="lazy"
        cursor="zoom-in"
        onClick={() => onOpenImage(url)}
        display="block"
        w={width ? `${Math.min(width, 300)}px` : "260px"}
        maxW="100%"
        // reserve the space before it loads so the chat doesn't jump
        aspectRatio={width && height ? `${width} / ${height}` : undefined}
        maxH="360px"
        objectFit="cover"
        borderRadius="14px"
        bg="rgba(0,0,0,0.25)"
      />
    );
  }

  if (kind === "video") {
    return (
      <Box
        as="video"
        src={playableUrl(attachment)}
        controls
        preload="metadata"
        playsInline
        display="block"
        w="300px"
        maxW="100%"
        maxH="360px"
        borderRadius="14px"
        bg="black"
      />
    );
  }

  return <VoiceNote src={playableUrl(attachment)} duration={duration} mine={mine} />;
};

export default MediaMessage;
