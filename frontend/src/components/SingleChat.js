import React, { useEffect, useRef, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, Spinner, Text, Input, IconButton,Button,Avatar } from "@chakra-ui/react";
import { getSender } from "../config/ChatLogics";
import axios from "axios";
import "./styles.css";
import ScorllableChat from "../components/ScorllableChat";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animation/Pudgy work.json";
import EmojiPicker from "emoji-picker-react";
import ProfileModal from "../components/miscellaneous/ProfileModal";
import UpdateGroupChatModal from "../components/miscellaneous/UpdateGroupChatModal";
import CatchUpSidebar from "../components/miscellaneous/CatchUpSidebar";



const ENDPOINT = "https://babble-cf3w.onrender.com";
let socket;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const { user, selectedChat, setNotification, setChats, setSelectedChat } = ChatState();

  const selectedChatCompare = useRef();
  const suggestionRef = useRef();
  const aiContainerRef = useRef();
  const emojiPickerRef = useRef();
  const emojiButtonRef = useRef();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
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
    socket = io(ENDPOINT);

    socket.emit("setup", user);

    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    return () => socket.disconnect();
  }, [user]);


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

      socket.emit("join chat", selectedChat._id);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    selectedChatCompare.current = selectedChat;
  }, [selectedChat]);

  const fetchAISuggestions = async () => {
    try {
      setAiLoading(true);

      const context = messages
        .slice(-6)
        .map((m) => m.content)
        .join("\n");

      const res = await axios.post("/api/ai/replies", {
        message: context,
      });

      setAiSuggestion(res.data || []);
    } catch (err) {
      console.log(err);
      setAiSuggestion([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCatchUp = async () => {
    try {
      setLoadingSummary(true);

      const { data } = await axios.post(
        "/api/ai/summarize",
        {
          messages: messages.map((m) => ({
            sender: m.sender.name,
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
      console.log(error);
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
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);

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

        socket.emit("new message", data);

        setMessages((prev) => [...prev, data]);

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === data.chat._id
              ? { ...chat, latestMessage: data }
              : chat,
          ),
        );
      } catch (error) {
        console.log(error);
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

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();

    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDifference = timeNow - lastTypingTime;

      if (timeDifference >= 3000 && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, 3000);
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

        if (chatIndex === -1) return prevChats;

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

    socket.on("message received", handleMessageReceived);

    return () => {
      socket.off("message received", handleMessageReceived);
    };
  }, [setNotification]);


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
            height="calc(100vh - 150px)"
            borderRadius="lg"
            overflow="hidden"
          >
            {loading ? (
              <Spinner size="xl" alignSelf="center" />
            ) : (
              <Box flex="1" overflow="hidden">
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
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
          width="100%"
        >
          <Text fontSize="2xl" fontWeight="600" color="gray.400">
            Select a chat to start texting
          </Text>
        </Box>
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
