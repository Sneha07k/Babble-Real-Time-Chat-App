import React, { useEffect, useRef, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, Spinner, Text, Input, Avatar } from "@chakra-ui/react";
import { getSender } from "../config/ChatLogics";
import axios from "axios";
import "./styles.css";
import ScorllableChat from "../components/ScorllableChat";
import Lottie from "react-lottie";
import animationData from "../animation/Pudgy work.json";
import EmojiPicker from "emoji-picker-react";
import ProfileModal from "../components/miscellaneous/ProfileModal";
import UpdateGroupChatModal from "../components/miscellaneous/UpdateGroupChatModal";
import CatchUpSidebar from "../components/miscellaneous/CatchUpSidebar";
import WelcomePanel from "./WelcomePanel";
import { toaster } from "./ui/toaster";

// rate-limit and "AI not configured" errors carry a readable reason
const showAiError = (error, fallback) =>
  toaster.create({
    description:
      error.response?.data?.message || error.response?.data?.error || fallback,
    type: "error",
  });

// small circular icon button used in the chat header and input bar
const RoundButton = React.forwardRef(({ size = "38px", ...props }, ref) => (
  <Box
    as="button"
    type="button"
    ref={ref}
    w={size}
    h={size}
    flexShrink={0}
    display="flex"
    alignItems="center"
    justifyContent="center"
    borderRadius="full"
    color="gray.300"
    bg="rgba(255,255,255,0.06)"
    cursor="pointer"
    transition="all 0.2s"
    _hover={{ bg: "rgba(255,255,255,0.12)", color: "white" }}
    _disabled={{ cursor: "not-allowed" }}
    {...props}
  />
));



const TYPING_TIMEOUT = 3000;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const {
    user,
    selectedChat,
    setNotification,
    setChats,
    setSelectedChat,
    socket,
    socketConnected,
  } = ChatState();

  const selectedChatCompare = useRef();
  // refs, not state: the typing timer must see the latest values
  const typingRef = useRef(false);
  const typingTimerRef = useRef();
  const suggestionRef = useRef();
  const aiContainerRef = useRef();
  const emojiPickerRef = useRef();
  const emojiButtonRef = useRef();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [open, setOpen] = useState(false);
  // const [selectedChat, setSelectedChat] = useState();

  const [aiSuggestion, setAiSuggestion] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState(null);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };



  useEffect(() => {
    if (!socket) return;

    // only show the indicator for the chat that is actually open
    const onTyping = (room) => {
      if (room === selectedChatCompare.current?._id) setIsTyping(true);
    };
    const onStopTyping = (room) => {
      if (room === selectedChatCompare.current?._id) setIsTyping(false);
    };

    socket.on("typing", onTyping);
    socket.on("stop typing", onStopTyping);

    return () => {
      socket.off("typing", onTyping);
      socket.off("stop typing", onStopTyping);
    };
  }, [socket]);


  useEffect(() => {
    setActiveSuggestion(-1);
  }, [aiSuggestion]);

  const fetchMessages = async () => {
    if (!selectedChat?._id) return;

    try {
      setLoading(true);

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const { data } = await axios.get(
        `/api/messages/${selectedChat._id}`,
        config,
      );

      setMessages(data);
      setLoading(false);
    } catch (err) {
      toaster.create({ description: "Failed to load messages", type: "error" });
      setLoading(false);
    }
  };

  // re-join after a reconnect too, since the server forgets rooms on disconnect
  useEffect(() => {
    if (socket && socketConnected && selectedChat?._id) {
      socket.emit("join chat", selectedChat._id);
    }
  }, [selectedChat, socket, socketConnected]);

  useEffect(() => {
    selectedChatCompare.current = selectedChat;
    setIsTyping(false);
    fetchMessages();
  }, [selectedChat]);

  const fetchAISuggestions = async () => {
    if (!messages.length) {
      toaster.create({
        description: "Send a message first, then Ask AI for replies",
        type: "info",
      });
      return;
    }

    try {
      setAiLoading(true);

      const context = messages
        .slice(-6)
        .map((m) => m.content)
        .join("\n");

      const res = await axios.post(
        "/api/ai/replies",
        { message: context },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      setAiSuggestion(res.data || []);
    } catch (err) {
      showAiError(err, "Couldn't get suggestions");
      setAiSuggestion([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCatchUp = async () => {
    if (loadingSummary) return;
    if (!messages.length) {
      toaster.create({
        description: "Nothing to summarize yet",
        type: "info",
      });
      return;
    }

    try {
      setLoadingSummary(true);

      const { data } = await axios.post(
        "/api/ai/summarize",
        {
          messages: messages.map((m) => ({
            sender: m.sender?.name || "Unknown",
            content: m.content,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      setSummary(data);
      setShowSummary(true);
    } catch (error) {
      showAiError(error, "Couldn't summarize this chat");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        aiContainerRef.current &&
        !aiContainerRef.current.contains(e.target)
      ) {
        setAiSuggestion([]);
        setActiveSuggestion(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // called by the Enter key and by the send button
  const sendMessage = async () => {
    if (newMessage.trim()) {
      clearTimeout(typingTimerRef.current);
      typingRef.current = false;
      socket?.emit("stop typing", selectedChat._id);

      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.post(
          "/api/messages",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config,
        );

        setNewMessage("");
        setAiSuggestion([]);
        setActiveSuggestion(-1);
        setShowEmojiPicker(false);

        // the server delivers the message to the other members after saving it
        setMessages((prev) => [...prev, data]);

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === data.chat._id
              ? { ...chat, latestMessage: data }
              : chat,
          ),
        );
      } catch (error) {
        toaster.create({
          description:
            error.response?.data?.message || "Message could not be sent",
          type: "error",
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (activeSuggestion >= 0 && aiSuggestion.length > 0) {
        setNewMessage(aiSuggestion[activeSuggestion]);
        setAiSuggestion([]);
        setActiveSuggestion(-1);
        return;
      }
      sendMessage();
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < aiSuggestion.length - 1 ? prev + 1 : 0,
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev > 0 ? prev - 1 : aiSuggestion.length - 1,
      );
    }

    if (e.key === "Escape") {
      setAiSuggestion([]);
      setActiveSuggestion(-1);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    setAiSuggestion([]);
    setActiveSuggestion(-1);

    if (!socketConnected) return;

    const room = selectedChat._id;

    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit("typing", room);
    }

    // restart the countdown on every keystroke; stop after 3s of silence
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      socket.emit("stop typing", room);
    }, TYPING_TIMEOUT);
  };

  useEffect(() => {
    const handleMessageReceived = (newMessageReceived) => {
      const currentChatId = selectedChatCompare.current?._id;
      const incomingChatId = newMessageReceived.chat._id;

      const isCurrentChatOpen = currentChatId === incomingChatId;

      if (!isCurrentChatOpen) {
        setNotification((prev) => {
          const alreadyExists = prev.some(
            (msg) => msg._id === newMessageReceived._id,
          );

          if (alreadyExists) return prev;

          return [newMessageReceived, ...prev];
        });
      }

      if (isCurrentChatOpen) {
        setMessages((prev) => [...prev, newMessageReceived]);
      }

      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex(
          (chat) => chat._id === incomingChatId,
        );

        // someone started a brand-new chat with us: show it at the top
        if (chatIndex === -1) {
          return [
            { ...newMessageReceived.chat, latestMessage: newMessageReceived },
            ...prevChats,
          ];
        }

        const updatedChat = {
          ...prevChats[chatIndex],
          latestMessage: newMessageReceived,
        };

        const newChats = [...prevChats];

        newChats.splice(chatIndex, 1);
        newChats.unshift(updatedChat);

        return newChats;
      });
    };

    if (!socket) return;

    socket.on("message received", handleMessageReceived);

    return () => {
      socket.off("message received", handleMessageReceived);
    };
  }, [socket]);
  const otherUser = selectedChat && !selectedChat.isGroupChat
    ? selectedChat.users.find((u) => u._id !== user._id)
    : null;

  const chatTitle = otherUser
    ? getSender(user, selectedChat.users)
    : selectedChat?.chatName;

  const memberCount = selectedChat?.users.filter((u) => !u.isBot).length;
  const chatSubtitle = isTyping
    ? "typing…"
    : otherUser?.isBot
      ? "AI assistant · always online"
      : otherUser
        ? otherUser.email
        : `${memberCount} member${memberCount === 1 ? "" : "s"}`;

  return (
    <>
      {selectedChat ? (
        <>
          {/* HEADER */}
          <Box
            w="100%"
            display="flex"
            alignItems="center"
            gap={{ base: 2, md: 3 }}
            pb={3}
            px={1}
          >
            <RoundButton
              display={{ base: "flex", md: "none" }}
              onClick={() => setSelectedChat(null)}
              aria-label="Back to chats"
            >
              <i className="fa-solid fa-arrow-left" />
            </RoundButton>

            <Box
              display="flex"
              alignItems="center"
              gap={3}
              flex="1"
              minW={0}
              cursor={otherUser ? "pointer" : "default"}
              onClick={() => otherUser && setOpen(true)}
            >
              <Avatar.Root size="md" flexShrink={0}>
                <Avatar.Image src={otherUser?.picture} />
                <Avatar.Fallback name={chatTitle} />
              </Avatar.Root>

              <Box minW={0}>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  color="white"
                  lineHeight="1.2"
                  truncate
                >
                  {chatTitle}
                </Text>
                <Text
                  fontSize="xs"
                  color={isTyping ? "var(--accent-light)" : "gray.400"}
                  fontStyle={isTyping ? "italic" : "normal"}
                  truncate
                >
                  {chatSubtitle}
                </Text>
              </Box>
            </Box>

            <RoundButton
              onClick={handleCatchUp}
              title="Catch up: AI summary of this chat"
              aria-label="Catch up"
              color="var(--accent-light)"
            >
              {loadingSummary ? (
                <Spinner size="sm" />
              ) : (
                <i className="fa-solid fa-newspaper" />
              )}
            </RoundButton>

            {selectedChat.isGroupChat && (
              <UpdateGroupChatModal
                fetchAgain={fetchAgain}
                setFetchAgain={setFetchAgain}
                fetchMessages={fetchMessages}
              />
            )}

            {otherUser && (
              <ProfileModal user={otherUser} open={open} setOpen={setOpen} />
            )}
          </Box>

          {/* MESSAGES */}
          <Box
            display="flex"
            flexDir="column"
            w="100%"
            flex="1"
            minH={0}
            bg="var(--chat-bg)"
            backgroundImage="radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)"
            backgroundSize="18px 18px"
            borderRadius="16px"
            border="1px solid rgba(255,255,255,0.05)"
            overflow="hidden"
          >
            {loading ? (
              <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                <Spinner size="xl" color="var(--accent-light)" />
              </Box>
            ) : (
              <Box flex="1" minH={0} overflow="hidden">
                <ScorllableChat
                  messages={messages}
                  isGroupChat={selectedChat.isGroupChat}
                />
              </Box>
            )}

            {isTyping && (
              <Box px={3} pb={1}>
                <Lottie options={defaultOptions} width={48} height={48} />
              </Box>
            )}
          </Box>

          {/* INPUT BAR */}
          <Box
            mt={3}
            w="100%"
            display="flex"
            alignItems="center"
            gap={2}
            position="relative"
          >
            {(aiSuggestion.length > 0 || aiLoading) && (
              <Box
                ref={aiContainerRef}
                position="absolute"
                bottom="100%"
                left="0"
                right="0"
                mb="8px"
                bg="var(--panel-strong)"
                border="1px solid"
                borderColor="color-mix(in srgb, var(--accent) 25%, transparent)"
                borderRadius="14px"
                p={2}
                zIndex={1000}
                boxShadow="0 10px 30px rgba(0,0,0,0.4)"
              >
                <Text fontSize="xs" color="gray.400" px={2} pb={1}>
                  {aiLoading ? "AI is thinking..." : "Suggested replies (↑ ↓ then Enter)"}
                </Text>

                {aiSuggestion.map((r, i) => (
                  <Text
                    key={i}
                    cursor="pointer"
                    bg={
                      i === activeSuggestion
                        ? "color-mix(in srgb, var(--accent) 25%, transparent)"
                        : "transparent"
                    }
                    px={2}
                    py="6px"
                    borderRadius="8px"
                    color="white"
                    fontSize="sm"
                    onMouseEnter={() => setActiveSuggestion(i)}
                    onClick={() => {
                      setNewMessage(r);
                      setAiSuggestion([]);
                      setActiveSuggestion(-1);
                    }}
                  >
                    {r}
                  </Text>
                ))}
              </Box>
            )}

            {showEmojiPicker && (
              <Box
                ref={emojiPickerRef}
                position="absolute"
                bottom="100%"
                left="0"
                mb="8px"
                zIndex={2000}
              >
                <EmojiPicker
                  theme="dark"
                  width={320}
                  height={380}
                  onEmojiClick={(emojiData) => {
                    setNewMessage((prev) => prev + emojiData.emoji);
                  }}
                />
              </Box>
            )}

            <Box
              flex="1"
              minW={0}
              display="flex"
              alignItems="center"
              gap={1}
              bg="rgba(255,255,255,0.06)"
              border="1px solid rgba(255,255,255,0.08)"
              borderRadius="full"
              pl={1}
              pr={1}
              transition="border-color 0.2s"
              _focusWithin={{ borderColor: "var(--accent)" }}
            >
              <RoundButton
                ref={emojiButtonRef}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                aria-label="Emoji"
                bg="transparent"
              >
                <i className="fa-regular fa-face-smile" />
              </RoundButton>

              <Input
                flex="1"
                minW={0}
                px={1}
                border="none"
                bg="transparent"
                color="white"
                placeholder="Type a message"
                _placeholder={{ color: "gray.500" }}
                _focus={{ boxShadow: "none", outline: "none" }}
                value={newMessage}
                onChange={typingHandler}
                onKeyDown={handleKeyDown}
              />

              <Box
                as="button"
                type="button"
                onClick={fetchAISuggestions}
                title="Ask AI for reply ideas"
                display="flex"
                alignItems="center"
                gap={2}
                flexShrink={0}
                h="34px"
                px={3}
                borderRadius="full"
                color="var(--accent-light)"
                bg="color-mix(in srgb, var(--accent) 15%, transparent)"
                fontSize="sm"
                fontWeight="600"
                cursor="pointer"
                transition="background 0.2s"
                _hover={{ bg: "color-mix(in srgb, var(--accent) 28%, transparent)" }}
              >
                <i className="fa-solid fa-wand-magic-sparkles" />
                <Text as="span" display={{ base: "none", md: "inline" }}>
                  Ask AI
                </Text>
              </Box>
            </Box>

            <RoundButton
              onClick={sendMessage}
              aria-label="Send message"
              size="44px"
              bg="var(--accent)"
              color="var(--on-accent)"
              disabled={!newMessage.trim()}
              opacity={newMessage.trim() ? 1 : 0.5}
              _hover={{ bg: "var(--accent-strong)" }}
            >
              <i className="fa-solid fa-paper-plane" />
            </RoundButton>
          </Box>
        </>
      ) : (
        <WelcomePanel />
      )}
      <CatchUpSidebar
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        summary={summary}
      />
    </>
  );
};

export default SingleChat;
