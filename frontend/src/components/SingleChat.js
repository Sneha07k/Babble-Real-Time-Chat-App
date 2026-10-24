import React, { useEffect, useRef, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, Spinner, Text, Input, IconButton,Button,Avatar } from "@chakra-ui/react";
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


  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage.trim()) {
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
      sendMessage(e);
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


  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            pr={4}
            w="100%"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text
              cursor="pointer"
              fontSize="24px"
              color="gray.300"
              _hover={{ color: "white" }}
              display={{ base: "block", md: "none" }}
              onClick={() => setSelectedChat(null)}
              p={3}
            >
              ←
            </Text>

            {!selectedChat.isGroupChat ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                w="100%"
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={3}
                  cursor="pointer"
                  onClick={() => setOpen(true)}
                >
                  <img
                    src={
                      selectedChat.users.find((u) => u._id !== user._id)
                        ?.picture
                    }
                    alt="profile"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #4a5568",
                    }}
                  />

                  <Text fontSize="lg" fontWeight="600" color="white">
                    {getSender(user, selectedChat.users)}
                  </Text>
                </Box>

                <Box display="flex" alignItems="center" gap={3}>
                  <button
                    onClick={handleCatchUp}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      background: "#1cb2c9",
                      color: "white",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "14px",
                      border: "none",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#18a3b8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#1cb2c9";
                    }}
                  >
                    <i className="fa-solid fa-newspaper"></i>
                  </button>
                </Box>

                <ProfileModal
                  user={selectedChat.users.find((u) => u._id !== user._id)}
                  open={open}
                  setOpen={setOpen}
                />
              </Box>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                w="100%"
              >
                <Box display="flex" alignItems="center" gap={3}>
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />

                  <Text>{selectedChat.chatName}</Text>
                </Box>

                <button
                  onClick={handleCatchUp}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "#1cb2c9",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px",
                    border: "none",
                  }}
                >
                  <i className="fa-solid fa-newspaper"></i>
                </button>
              </Box>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            p={3}
            bg="gray.800"
            w="100%"
            height="100%"
            borderRadius="lg"
            minH={0}
            overflow="hidden"
          >
            {loading ? (
              <Spinner size="xl" alignSelf="center" />
            ) : (
              <Box flex="1" minH={0} overflow="hidden">
                <ScorllableChat messages={messages} />
              </Box>
            )}

            {isTyping && (
              <Box display="flex" mt={2}>
                <Box width="60px" height="60px">
                  <Lottie options={defaultOptions} width={60} height={60} />
                </Box>
              </Box>
            )}

            <Box mt={3} display="flex" alignItems="center" gap={2}>
              <Box
                position="relative"
                flex="1"
                display="flex"
                alignItems="center"
                gap={2}
              >
                {(aiSuggestion.length > 0 || aiLoading) && (
                  <Box
                    ref={aiContainerRef}
                    position="absolute"
                    bottom="100%"
                    left="0"
                    right="0"
                    mb="8px"
                    bg="gray.700"
                    borderRadius="10px"
                    p={2}
                    zIndex={1000}
                  >
                    {aiLoading && (
                      <Text fontSize="sm" color="gray.400">
                        AI is thinking...
                      </Text>
                    )}

                    {aiSuggestion.map((r, i) => (
                      <Text
                        key={i}
                        cursor="pointer"
                        bg={i === activeSuggestion ? "gray.600" : "transparent"}
                        px={2}
                        py={1}
                        borderRadius="6px"
                        _hover={{ color: "#22d3ee" }}
                        color="white"
                        fontSize="sm"
                        mb={1}
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
                    bottom="60px"
                    left="0"
                    zIndex={2000}
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setNewMessage((prev) => prev + emojiData.emoji);
                      }}
                    />
                  </Box>
                )}

                <Input
                  placeholder="Enter a message...."
                  variant="filled"
                  bg="#383333"
                  value={newMessage}
                  onChange={typingHandler}
                  onKeyDown={handleKeyDown}
                />

                <button
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#333",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  😊
                </button>
              </Box>

              <button
                onClick={fetchAISuggestions}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(59, 130, 246, 0.08)",
                  color: "#e5e7eb",
                  fontWeight: "600",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid rgba(96, 165, 250, 0.15)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.12)";
                  e.currentTarget.style.borderColor = "#10b981";
                  e.currentTarget.style.color = "#d1fae5";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
                  e.currentTarget.style.borderColor =
                    "rgba(109, 168, 240, 0.53)";
                  e.currentTarget.style.color = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                Ask AI
              </button>
            </Box>
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
