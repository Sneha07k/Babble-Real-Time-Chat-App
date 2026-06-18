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
      bg="rgba(12, 18, 35, 0.95)"
      h="97.5%"
      w={{ base: "100%", md: "68%" }}
      borderRadius="18px"
      border="1px solid"
      borderColor="rgba(0, 255, 255, 0.12)"
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
