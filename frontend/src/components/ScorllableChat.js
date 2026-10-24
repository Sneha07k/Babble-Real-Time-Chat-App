import React, { useEffect, useRef } from "react";
import { Avatar, Box, Text } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import { formatDayLabel, formatTime, isSameDay } from "../config/ChatLogics";

// readable on the dark bubble; each person always gets the same colour
const NAME_COLORS = ["#FFB86B", "#7EE7A8", "#7CC7FF", "#FF8FB1", "#E3B5FF", "#F5E07A"];
const nameColor = (id = "") =>
  NAME_COLORS[[...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % NAME_COLORS.length];

const BIG = "18px";
const SMALL = "5px";

const DaySeparator = ({ date }) => (
  <Box display="flex" justifyContent="center" my={4}>
    <Text
      fontSize="xs"
      fontWeight="600"
      color="gray.300"
      bg="rgba(255,255,255,0.06)"
      px={3}
      py={1}
      borderRadius="full"
    >
      {formatDayLabel(date)}
    </Text>
  </Box>
);

const ScorllableChat = ({ messages, isGroupChat }) => {
  const { user } = ChatState();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      height="100%"
      minHeight="0"
      overflowY="auto"
      px={{ base: 2, md: 4 }}
      py={3}
      css={{
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.2)",
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-track": { background: "transparent" },
      }}
    >
      {messages?.map((m, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const senderId = m.sender?._id;
        const mine = senderId === user._id;

        const newDay = !prev || !isSameDay(prev.createdAt, m.createdAt);
        // consecutive messages from one person form a group, like most messengers
        const firstOfRun = newDay || prev.sender?._id !== senderId;
        const lastOfRun =
          !next ||
          next.sender?._id !== senderId ||
          !isSameDay(next.createdAt, m.createdAt);

        // the corner on the sender's side is squared off inside a group
        const corners = mine
          ? {
              borderTopRightRadius: firstOfRun ? BIG : SMALL,
              borderBottomRightRadius: lastOfRun ? BIG : SMALL,
            }
          : {
              borderTopLeftRadius: firstOfRun ? BIG : SMALL,
              borderBottomLeftRadius: lastOfRun ? BIG : SMALL,
            };

        return (
          <React.Fragment key={m._id}>
            {newDay && m.createdAt && <DaySeparator date={m.createdAt} />}

            <Box
              display="flex"
              justifyContent={mine ? "flex-end" : "flex-start"}
              alignItems="flex-end"
              gap={2}
              mt={firstOfRun ? 3 : "2px"}
            >
              {!mine &&
                (lastOfRun ? (
                  <Avatar.Root size="xs" flexShrink={0}>
                    <Avatar.Image src={m.sender?.picture} />
                    <Avatar.Fallback name={m.sender?.name} />
                  </Avatar.Root>
                ) : (
                  <Box w="24px" flexShrink={0} />
                ))}

              <Box
                maxW={{ base: "80%", md: "65%" }}
                bg={mine ? "var(--bubble-mine)" : "var(--bubble-theirs)"}
                color="white"
                px={3}
                pt="6px"
                pb="4px"
                borderRadius={BIG}
                {...corners}
                boxShadow="0 1px 2px rgba(0,0,0,0.25)"
              >
                {isGroupChat && !mine && firstOfRun && (
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color={nameColor(senderId)}
                    mb="2px"
                  >
                    {m.sender?.name || "Unknown"}
                  </Text>
                )}

                <Text
                  as="span"
                  fontSize="sm"
                  lineHeight="1.45"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  {m.content}
                </Text>

                {/* floats into the last line when there's room, like WhatsApp */}
                <Text
                  as="span"
                  float="right"
                  ml={3}
                  mt="6px"
                  fontSize="10px"
                  lineHeight="1"
                  color={mine ? "rgba(255,255,255,0.75)" : "gray.400"}
                  whiteSpace="nowrap"
                >
                  {m.createdAt && formatTime(m.createdAt)}
                  {mine && (
                    <i
                      className="fa-solid fa-check"
                      style={{ marginLeft: 4 }}
                      title="Sent"
                    />
                  )}
                </Text>
              </Box>
            </Box>
          </React.Fragment>
        );
      })}

      <div ref={bottomRef} />
    </Box>
  );
};

export default ScorllableChat;
