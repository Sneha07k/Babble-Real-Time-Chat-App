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
      bg="color-mix(in srgb, var(--accent) 15%, transparent)"
      border="1px solid"
      borderColor="color-mix(in srgb, var(--accent) 25%, transparent)"
      color="var(--accent-light)"
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
