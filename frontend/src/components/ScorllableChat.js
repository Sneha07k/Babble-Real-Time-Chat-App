import React, { useEffect, useRef } from "react";
import { Avatar, Box, Text } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import { formatDayLabel, formatTime, isSameDay } from "../config/ChatLogics";
import MediaMessage from "./MediaMessage";

// readable on the dark bubble; each person always gets the same colour
const NAME_COLORS = ["#FFB86B", "#7EE7A8", "#7CC7FF", "#FF8FB1", "#E3B5FF", "#F5E07A"];
const nameColor = (id = "") =>
  NAME_COLORS[[...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % NAME_COLORS.length];

const BIG = "20px";
const SMALL = "6px";

const DaySeparator = ({ date }) => (
  <Box display="flex" justifyContent="center" my={4}>
    <Text
      fontSize="xs"
      fontWeight="600"
      color="white"
      bg="rgba(0,0,0,0.35)"
      backdropFilter="blur(6px)"
      px={3}
      py={1}
      borderRadius="full"
    >
      {formatDayLabel(date)}
    </Text>
  </Box>
);

// ✓ sent, ✓✓ seen by everyone else in the chat (not shown in big public rooms)
const ReadTicks = ({ message, members, userId }) => {
  const others = members.filter((id) => id !== userId);
  const readBy = (message.readBy || []).map(String);
  const seen = others.length > 0 && others.every((id) => readBy.includes(id));
  return (
    <i
      className={`fa-solid ${seen ? "fa-check-double" : "fa-check"}`}
      style={{ marginLeft: 4, color: seen ? "#a5f3fc" : undefined }}
      title={seen ? "Seen" : "Sent"}
    />
  );
};

const ScorllableChat = ({ messages, chat, mineColor, onOpenImage }) => {
  const { user } = ChatState();
  const bottomRef = useRef(null);
  const members = (chat?.users || []).map((u) => String(u._id || u));
  const showTicks = !chat?.isCommunity;

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
      {messages?.length === 0 && (
        <Box textAlign="center" color="gray.300" mt={16}>
          <Text fontSize="5xl">👋</Text>
          <Text fontFamily="heading" fontSize="xl" fontWeight="600">
            No messages yet
          </Text>
          <Text fontSize="sm" color="gray.400">
            Break the ice: send a hi, a photo or a voice note!
          </Text>
        </Box>
      )}

      {messages?.map((m, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const senderId = m.sender?._id;
        const mine = senderId === user._id;
        const media = m.attachment?.url ? m.attachment : null;

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
              className={i === messages.length - 1 ? "babble-pop" : undefined}
              display="flex"
              justifyContent={mine ? "flex-end" : "flex-start"}
              alignItems="flex-end"
              gap={2}
              mt={firstOfRun ? 3 : "3px"}
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
                maxW={{ base: "82%", md: "65%" }}
                bg={mine ? mineColor : "var(--bubble-theirs)"}
                color="white"
                px={media && media.kind !== "audio" ? "4px" : 3}
                pt={media && media.kind !== "audio" ? "4px" : "7px"}
                pb="5px"
                borderRadius={BIG}
                {...corners}
                boxShadow="0 2px 6px rgba(0,0,0,0.25)"
              >
                {chat?.isGroupChat && !mine && firstOfRun && (
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color={nameColor(senderId)}
                    mb="2px"
                    px={media && media.kind !== "audio" ? 2 : 0}
                  >
                    {m.sender?.name || "Unknown"}
                  </Text>
                )}

                {media && (
                  <MediaMessage attachment={media} mine={mine} onOpenImage={onOpenImage} />
                )}

                {/* flow-root keeps the floated time inside the bubble when there's no text */}
                <Box display="flow-root" px={media && media.kind !== "audio" ? 2 : 0} pt={media ? 1 : 0}>
                  {m.content && (
                    <Text
                      as="span"
                      fontSize="sm"
                      lineHeight="1.45"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                    >
                      {m.content}
                    </Text>
                  )}

                  {/* floats into the last line when there's room, like WhatsApp */}
                  <Text
                    as="span"
                    float="right"
                    ml={3}
                    mt="6px"
                    fontSize="10px"
                    lineHeight="1"
                    color={mine ? "rgba(255,255,255,0.8)" : "gray.400"}
                    whiteSpace="nowrap"
                  >
                    {m.createdAt && formatTime(m.createdAt)}
                    {mine && showTicks && (
                      <ReadTicks message={m} members={members} userId={user._id} />
                    )}
                  </Text>
                </Box>
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
