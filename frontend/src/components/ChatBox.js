import React from 'react'
import { ChatState } from "../Context/ChatProvider";
import { Box } from '@chakra-ui/react';
import SingleChat from './SingleChat';

const ChatBox = ({fetchAgain,setFetchAgain}) => {
  const { selectedChat } = ChatState();
 
   return (
     <Box
       display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
       flexDir="column"
       alignItems="center"
       p={3}
       bg="gray.900"
       h="97.5%"
       w={{ base: "100%", md: "68%" }}
       borderRadius="lg"
       borderWidth="1px"
       color="white"
     >
       <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
     </Box>
   );
}

export default ChatBox
