import React from "react";
import { Avatar } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import { Text } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
const UserListItem = ({ user,handleFunction }) => {
//   const { user } = ChatState();
  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="green"
      _hover={{
        background: "#38B2AC",
        color: "white",
      }}
      w="100%"
      display="flex"
      alignItems="center"
      color="black"
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
    >
      <Avatar.Root size="sm">
        <Avatar.Image src={user.picture} />
        <Avatar.Fallback name={user.name} />
      </Avatar.Root>
      <Box>
        <Text ml={3}>{user.name}</Text>
        <Text ml={3}>
          <b>Email:</b>
          {user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;
