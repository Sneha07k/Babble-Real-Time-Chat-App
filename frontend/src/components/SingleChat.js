import React, { useEffect, useRef, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, IconButton, Spinner, Text } from "@chakra-ui/react";
import { getSender } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { Field, Input } from "@chakra-ui/react";
import axios from "axios";
import { toaster } from "./ui/toaster";
import "./styles.css";
import ScorllableChat from "../components/ScorllableChat";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animation/Pudgy work.json";

const ENDPOINT = "http://localhost:5000";

let socket;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const {
    user,
    selectedChat,
    setSelectedChat,
    notification,
    setNotification,
    chats,
    setChats,
  } = ChatState();

  const selectedChatCompare = useRef();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [open, setOpen] = useState(false);

  const defaultOptions = {
    loop: true,

    autoplay: true,

    animationData: animationData,

    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    socket = io(ENDPOINT);

    socket.emit("setup", user);

    socket.on("connected", () => {
      setSocketConnected(true);
    });

    socket.on("typing", () => {
      setIsTyping(true);
    });

    socket.on("stop typing", () => {
      setIsTyping(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

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

        socket.emit("new message", data);

        setMessages((prev) => [...prev, data]);
       setChats((prevChats) =>
         prevChats.map((chat) =>
           chat._id === data.chat._id ? { ...chat, latestMessage: data } : chat,
         ),
       );
       
      } catch (error) {
        toaster.create({
          title: "Error occurred",

          type: "error",
        });
      }
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat?._id) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/messages/${selectedChat._id}`,

        config,
      );

      setMessages(data);

      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      console.log(error);

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    selectedChatCompare.current = selectedChat;
  }, [selectedChat]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

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

    // 3. ALWAYS update chats (IMPORTANT FIX)
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
            fontFamily="Work sans"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <IconButton
              aria-label="Back"
              mr="10px"
              display={{ base: "flex", md: "none" }}
              onClick={() => setSelectedChat(null)}
            >
              <i className="fa-solid fa-arrow-left-long"></i>
            </IconButton>

            {!selectedChat.isGroupChat ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                w="100%"
              >
                <Box>
                  <Text>{getSender(user, selectedChat.users)}</Text>
                </Box>

                <Box>
                  <Text
                    cursor="pointer"
                    color="blue.300"
                    onClick={() => setOpen(true)}
                  >
                    <i className="fa-solid fa-circle-user"></i>
                  </Text>

                  <ProfileModal
                    user={selectedChat.users.find((u) => u._id !== user._id)}
                    open={open}
                    setOpen={setOpen}
                  />
                </Box>
              </Box>
            ) : (
              <>
                <span>{selectedChat.chatName.toUpperCase()}</span>

                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
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
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <Box flex="1" overflow="hidden">
                <ScorllableChat messages={messages} />
              </Box>
            )}

            <Field.Root mt={3}>
              {isTyping && (
                <Lottie
                  options={defaultOptions}
                  width={70}
                  style={{
                    marginBottom: 15,

                    transform: "scaleX(-1)",
                  }}
                />
              )}

              <Input
                placeholder="Enter a message...."
                variant="filled"
                bg="#383333"
                onChange={typingHandler}
                value={newMessage}
                onKeyDown={sendMessage}
              />
            </Field.Root>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work Sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
