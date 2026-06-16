import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChatState } from "../Context/ChatProvider";
import { toaster } from "./ui/toaster";
import { Box, Button, Stack } from "@chakra-ui/react";
import ChatLoading from "./ChatLoading";
import { Text } from "@chakra-ui/react";
import { getSender } from "../config/ChatLogics";
import GroupChatModal from "./miscellaneous/GroupChatModal";

const MyChats = ({fetchAgain}) => {
  const [loggedUser, setLoggedUser] = useState();

  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      console.log(data);
      setChats(data);
    } catch (error) {
      toaster.create({
        title: "Error Occurred",
        type: "error",
        description: "Failed to load the chats",
      });
    }
  };

  useEffect(() => {
    if (user) {
      setLoggedUser(user);
      fetchChats();
    }
  }, [fetchAgain]);

 return (
   <Box
     display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
     flexDir="column"
    //  alignItems="center"
     p={3}
     bg="gray.900"
     height="86vh"
     w={{ base: "100%", md: "31%" }}
     borderRadius="lg"
   >
     <Box
       display="flex"
       alignItems="center"
       justifyContent="space-between"
       pb={3}
     >
       <Box
         //  pb={3}
         //  px={3}
         pl={3}
         fontSize={{ base: "28px", md: "30px" }}
         fontFamily="Work sans"
         d="flex"
         w="100%"
         justifyContent="space-between"
         alignItems="center"
       >
         My Chats
       </Box>
       <GroupChatModal>
         <Button>
           New Group Chat
           <i class="fa-solid fa-plus"></i>
         </Button>
       </GroupChatModal>
     </Box>

     <Box
       d="flex"
       flexDir="column"
       p={7}
       bg="gray.700"
       w="100%"
       h="88%"
       borderRadius="lg"
       overflowY="hidden"
     >
       {chats ? (
         <Stack overflowY="scroll">
           {chats.map((chat) => (
             <Box
               onClick={() => setSelectedChat(chat)}
               cursor="pointer"
               bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
               color={selectedChat === chat ? "white" : "black"}
               _hover={{
                 bg: "green.500",
                 color: "white",
               }}
               py={2}
               borderRadius="lg"
               key={chat._id}
             >
               <Text px={4}>
                 {!chat.isGroupChat
                   ? getSender(loggedUser, chat.users)
                   : chat.chatName}
               </Text>
             </Box>
           ))}
         </Stack>
       ) : (
         <ChatLoading />
       )}
     </Box>
   </Box>
 );
};

export default MyChats;
