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

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const { user,selectedChat, setSelectedChat } = ChatState();
  // const { user, selectedChat, setSelectedChat } = ChatState();
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const sendMessage = async (event) => {
    if (event.key == "Enter" && newMessage) {
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
    if (!selectedChat) return;
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
      console.log(data);
      setMessages(data);
      setLoading(false);
    } catch (error) {
        toaster.create({
          title: "Error occurred",
          type: "error",
        });
      setLoading(false);
    }
    
  }

  useEffect(() => {
    fetchMessages();
  }, [selectedChat]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    // typing indicator logic
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
                  <ScorllableChat messages= {messages}/>
              </div>
            )}
            <Field.Root isRequired mt={3}>
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
