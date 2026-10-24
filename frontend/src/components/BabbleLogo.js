import React, { useId } from "react";
import { Box, Text } from "@chakra-ui/react";

// a lowercase "b" made from a speech bubble: the stem, a round bowl with
// typing dots, a bubble tail, and a small highlight "pop"
// colours come from the palette in index.css, so the logo re-themes with the app
export const BabbleMark = ({ size = 36 }) => {
  // unique per instance so two logos on one page don't share a gradient
  const gradientId = `babble-mark-${useId().replace(/:/g, "")}`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--c1)" }} />
          <stop offset="1" style={{ stopColor: "var(--c2)" }} />
        </linearGradient>
      </defs>
      <rect x="5" y="3" width="11" height="32" rx="5.5" fill={`url(#${gradientId})`} />
      <circle cx="27" cy="28" r="16" fill={`url(#${gradientId})`} />
      <path d="M35 40 L46 47 L41.5 34 Z" fill={`url(#${gradientId})`} />
      <circle cx="20.5" cy="28" r="2.4" fill="white" />
      <circle cx="27" cy="28" r="2.4" fill="white" />
      <circle cx="33.5" cy="28" r="2.4" fill="white" />
      <circle cx="41" cy="8" r="4" style={{ fill: "var(--highlight)" }} />
    </svg>
  );
};

const BabbleLogo = ({ size = 36, showText = true }) => (
  <Box display="inline-flex" alignItems="center" gap={`${Math.round(size * 0.22)}px`}>
    <BabbleMark size={size} />
    {showText && (
      <Text
        as="span"
        fontFamily="heading"
        fontWeight="700"
        fontSize={`${Math.round(size * 0.82)}px`}
        lineHeight="1"
        letterSpacing="-0.02em"
        color="white"
      >
        babble
      </Text>
    )}
  </Box>
);

export default BabbleLogo;
