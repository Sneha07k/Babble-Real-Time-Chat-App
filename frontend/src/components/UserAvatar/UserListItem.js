import React from "react";
import { Avatar, Box, Text } from "@chakra-ui/react";

const UserListItem = ({ user, handleFunction }) => {
  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      w="100%"
      display="flex"
      alignItems="center"
      gap={3}
      px={4}
      py={3}
      mb={2}
      borderRadius="14px"
      bg="rgba(255,255,255,0.04)"
      border="1px solid"
      borderColor="rgba(255,255,255,0.05)"
      transition="all 0.2s ease"
      _hover={{
        bg: "rgba(34,211,238,0.15)",
        borderColor: "rgba(34,211,238,0.25)",
        transform: "translateY(-1px)",
      }}
    >
      <Avatar.Root size="sm" border="2px solid rgba(255,255,255,0.08)">
        <Avatar.Image src={user.picture} />
        <Avatar.Fallback name={user.name} />
      </Avatar.Root>

      <Box overflow="hidden">
        <Text color="white" fontWeight="600" fontSize="sm">
          {user.name}
        </Text>

        <Text
          color="gray.400"
          fontSize="xs"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          maxW="220px"
        >
          {user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;
