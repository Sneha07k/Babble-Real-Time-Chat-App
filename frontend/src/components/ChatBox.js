import React from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box } from "@chakra-ui/react";
import SingleChat from "./SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={4}
      bg="var(--panel)"
      h="97.5%"
      w={{ base: "100%", md: "68%" }}
      borderRadius="18px"
      border="1px solid"
      borderColor="color-mix(in srgb, var(--accent) 12%, transparent)"
      color="white"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.35)"
      backdropFilter="blur(10px)"
      overflow="hidden"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Box>
  );
};

export default ChatBox;
