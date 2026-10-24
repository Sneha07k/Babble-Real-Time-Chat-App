import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChatState } from "../Context/ChatProvider";
import { toaster } from "./ui/toaster";
import { Box, Button, Stack,Spinner } from "@chakra-ui/react";
import ChatLoading from "./ChatLoading";
import { Text } from "@chakra-ui/react";
import { getSender } from "../config/ChatLogics";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Avatar } from "@chakra-ui/react";
import WelcomePanel from "./WelcomePanel";

const ChatTag = ({ children }) => (
  <Text
    as="span"
    ml={2}
    px={2}
    py="1px"
    borderRadius="full"
    fontSize="10px"
    fontWeight="700"
    letterSpacing="0.5px"
    textTransform="uppercase"
    bg="rgba(34,211,238,0.15)"
    color="#67E8F9"
    verticalAlign="middle"
  >
    {children}
  </Text>
);

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [loading, setLoading] = useState(false);
  // phones only: the right-hand welcome panel is hidden there
  const [showWelcome, setShowWelcome] = useState(false);

  const { selectedChat, setSelectedChat, user, chats, setChats, socket } =
    ChatState();

 const fetchChats = async () => {
   try {
     setLoading(true);

     const config = {
       headers: {
         Authorization: `Bearer ${user.token}`,
       },
     };

     const { data } = await axios.get("/api/chat", config);

     setChats(data);
   } catch (error) {
     toaster.create({
       title: "Error Occurred",
       type: "error",
       description: "Failed to load the chats",
     });
   } finally {
     setLoading(false);
   }
 };

  useEffect(() => {
    if (user) {
      setLoggedUser(user);
      fetchChats();
    }
  }, [user, fetchAgain]);

  useEffect(() => {
    setShowWelcome(false);
  }, [selectedChat]);

  // a friend signed up with our invite link: their chat appears right away
  useEffect(() => {
    if (!socket) return;

    const onNewChat = (chat) => {
      setChats((prev) =>
        prev.some((c) => c._id === chat._id) ? prev : [chat, ...prev],
      );
      const friend = chat.users.find((u) => u._id !== user._id);
      toaster.create({
        description: `${friend?.name || "Someone"} joined from your invite`,
        type: "success",
      });
    };

    socket.on("new chat", onNewChat);
    return () => socket.off("new chat", onNewChat);
  }, [socket, user, setChats]);

  if (!user || !loggedUser) {
    return null;
  }

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      p={4}
      bg="rgba(8,12,28,0.95)"
      backdropFilter="blur(12px)"
      h="97.5%"
      w={{ base: "100%", md: "31%" }}
      borderRadius="20px"
      border="1px solid"
      borderColor="rgba(0,255,255,0.08)"
      boxShadow="0 8px 30px rgba(0,0,0,0.45)"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        pb={4}
        px={2}
      >
        <Box
          fontSize={{ base: "28px", md: "32px" }}
          fontWeight="700"
          color="white"
          letterSpacing="-0.5px"
        >
          My Chats
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Button
            display={{ base: "flex", md: "none" }}
            size="sm"
            borderRadius="12px"
            bg={showWelcome ? "#22D3EE" : "rgba(255,255,255,0.08)"}
            color={showWelcome ? "#0B0D12" : "white"}
            onClick={() => setShowWelcome((prev) => !prev)}
            aria-label="Get started"
          >
            <i className="fa-solid fa-compass"></i>
          </Button>

          <GroupChatModal>
            <Button
              size="sm"
              bg="white"
              color="gray.800"
              borderRadius="12px"
              fontWeight="600"
              px={4}
              _hover={{
                bg: "gray.100",
                transform: "translateY(-1px)",
              }}
            >
              New Group Chat
              <i className="fa-solid fa-plus" style={{ marginLeft: "8px" }}></i>
            </Button>
          </GroupChatModal>
        </Box>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="rgba(255,255,255,0.02)"
        w="100%"
        h="88%"
        borderRadius="18px"
        overflow="hidden"
      >
        {showWelcome ? (
          <WelcomePanel />
        ) : loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            h="100%"
          >
            <Spinner size="xl" color="#22D3EE" borderWidth="4px" />
          </Box>
        ) : (
          <Stack
            overflowY="auto"
            gap={2}
            css={{
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#22d3ee",
                borderRadius: "10px",
              },
            }}
          >
            {chats.map((chat) => (
              <Box
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={
                  selectedChat?._id === chat._id
                    ? "rgba(34,211,238,0.22)"
                    : "rgba(255,255,255,0.03)"
                }
                color="white"
                _hover={{
                  bg:
                    selectedChat?._id === chat._id
                      ? "rgba(34,211,238,0.28)"
                      : "rgba(255,255,255,0.06)",
                }}
                borderRadius="16px"
                px={4}
                py={2}
                transition="all 0.2s ease"
                border="1px solid"
                borderColor={
                  selectedChat?._id === chat._id
                    ? "rgba(34,211,238,0.25)"
                    : "transparent"
                }
              >
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar.Root
                    size="sm"
                    border="2px solid rgba(255,255,255,0.1)"
                  >
                    <Avatar.Image
                      src={
                        !chat.isGroupChat
                          ? chat.users.find((u) => u._id !== loggedUser._id)
                              ?.picture
                          : undefined
                      }
                    />

                    <Avatar.Fallback
                      name={
                        !chat.isGroupChat
                          ? getSender(loggedUser, chat.users)
                          : chat.chatName
                      }
                    />
                  </Avatar.Root>

                  <Box overflow="hidden" flex="1">
                    <Text fontWeight="600" fontSize="md" color="white">
                      {!chat.isGroupChat
                        ? getSender(loggedUser, chat.users)
                        : chat.chatName}
                      {!chat.isGroupChat &&
                        chat.users.some((u) => u.isBot) && <ChatTag>AI</ChatTag>}
                      {chat.isCommunity && <ChatTag>Community</ChatTag>}
                    </Text>

                    <Text
                      fontSize="sm"
                      color="gray.400"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                    >
                      {chat.latestMessage?.content || "No messages yet"}
                    </Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
