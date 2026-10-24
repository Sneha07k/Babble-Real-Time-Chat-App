import React from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box } from "@chakra-ui/react";
import SingleChat from "./SingleChat";
import ExplorePage from "./ExplorePage";

const ChatBox = ({ fetchAgain, setFetchAgain, view, setView, hiddenOnMobile }) => {
  const { selectedChat } = ChatState();
  const showExplore = view === "explore" && !selectedChat;

  return (
    <Box
      display={{ base: hiddenOnMobile ? "none" : "flex", md: "flex" }}
      flexDir="column"
      flex="1"
      minW={0}
      h="100%"
      p={showExplore ? 0 : { base: 2, md: 3 }}
      bg="var(--panel)"
      borderRadius={{ base: 0, md: "24px" }}
      border={{ base: "none", md: "1px solid rgba(255,255,255,0.07)" }}
      color="white"
      boxShadow="0 12px 40px rgba(0, 0, 0, 0.35)"
      backdropFilter="blur(14px)"
      overflow="hidden"
    >
      {showExplore ? (
        <ExplorePage setView={setView} />
      ) : (
        <SingleChat
          fetchAgain={fetchAgain}
          setFetchAgain={setFetchAgain}
          setView={setView}
        />
      )}
    </Box>
  );
};

export default ChatBox;
