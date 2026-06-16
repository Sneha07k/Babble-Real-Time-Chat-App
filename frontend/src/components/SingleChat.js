import React, { useEffect} from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, IconButton, Spinner, Text } from "@chakra-ui/react";
import { getSender } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import { useState } from "react";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { Field,Input } from "@chakra-ui/react";
import axios from "axios";
import { toaster } from "./ui/toaster";
import "./styles.css"
import ScorllableChat from "../components/ScorllableChat"
import io from 'socket.io-client'
import Lottie from 'react-lottie';
import animationData from "../animation/Pudgy work.json"

const ENDPOINT = "http://localhost:5000"
var socket, selectedChatCompare;


const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const { user,selectedChat, setSelectedChat } = ChatState();
  // const { user, selectedChat, setSelectedChat } = ChatState();
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
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
    socket.on("connected", () => setSocketConnected(true));
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));
  }, []);


  const sendMessage = async (event) => {
    if (event.key == "Enter" && newMessage) {
      socket.emit('stop typing', selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");

        const { data } = await axios.post("/api/messages",

          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        console.log(data);
        socket.emit("new message", data);
        setMessages([...messages, data])
        
      } catch (error) {
        toaster.create({
          title: "Error occurred",
          type: "error"
        });
      }
    }
  }




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

    // console.log("MESSAGES API RESPONSE:", data);

    setMessages(data);
    setLoading(false);
    socket.emit('join chat', selectedChat._id);
  } catch (error) {
    console.log(error);
    setLoading(false);
  }
};

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);


  useEffect(() => {
    socket.on('message received', (newMessageReceived) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
        //give notification;
      }
      else {
        setMessages([...messages, newMessageReceived]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit('typing', selectedChat._id); 
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDifference = timeNow - lastTypingTime;
      if (timeDifference >= timerLength && typing) {
        socket.emit('stop typing', selectedChat._id);
        setTyping(false);
      }
    },timerLength)
  }

const [open, setOpen] = useState(false);
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

            {/* Chat Header */}
            {!selectedChat.isGroupChat ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                w="100%"
              >
                {/* LEFT SIDE */}
                <Box display="flex" alignItems="center" gap="10px">
                  <Text>{getSender(user, selectedChat.users)}</Text>
                </Box>

                {/* RIGHT SIDE */}
                <Box display="flex" alignItems="center">
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
            display={"flex"}
            flexDir={"column"}
            justifyContent={"flex-end"}
            p={3}
            bg="gray.800"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {/* messages below */}
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScorllableChat messages={messages} />
              </div>
            )}
            <Field.Root isRequired mt={3}>
              {isTyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                    style={{ transform: "scaleX(-1)" }}
                  />
                </div>
              ) : (
                <></>
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
