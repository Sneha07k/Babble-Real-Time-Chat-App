import React from "react";
import { Box } from "@chakra-ui/react";

const UserBadgeItem = ({ user, handleFunction }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      px={3}
      py={1.5}
      borderRadius="full"
      m={1}
      bg="rgba(34,211,238,0.15)"
      border="1px solid"
      borderColor="rgba(34,211,238,0.25)"
      color="#67E8F9"
      fontSize="sm"
      fontWeight="500"
      cursor="pointer"
      transition="all 0.2s ease"
      _hover={{
        bg: "rgba(239,68,68,0.15)",
        borderColor: "rgba(239,68,68,0.3)",
        color: "#FCA5A5",
      }}
      onClick={handleFunction}
    >
      {user.name}

      <i className="fa-solid fa-xmark" />
    </Box>
  );
};

export default UserBadgeItem;
