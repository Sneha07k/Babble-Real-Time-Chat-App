import { useState } from "react";
import { Redirect } from "react-router-dom";
import { ChatState } from "../Context/ChatProvider";
import { Box } from "@chakra-ui/react";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const Chatpage = () => {
  const { user, selectedChat } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  // what the main panel shows when no chat is open: "chats" (welcome) or "explore"
  const [view, setView] = useState("chats");

  if (!user) return <Redirect to="/" />;

  // on phones only one column fits: the list, or whatever is open
  const mainOpen = Boolean(selectedChat) || view === "explore";

  return (
    <Box
      w="100%"
      h="100dvh"
      display="flex"
      gap={{ base: 0, md: 3 }}
      p={{ base: 0, md: 3 }}
      overflow="hidden"
    >
      <MyChats
        fetchAgain={fetchAgain}
        view={view}
        setView={setView}
        hiddenOnMobile={mainOpen}
      />
      <ChatBox
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
        view={view}
        setView={setView}
        hiddenOnMobile={!mainOpen}
      />
    </Box>
  );
};

export default Chatpage;
