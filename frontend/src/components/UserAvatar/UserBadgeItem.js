import React from 'react'
import { Box } from '@chakra-ui/react';
const UserBadgeItem = ({user,handleFunction}) => {
  return (
    <Box
      px={2}
      py={1}
      borderRadius="lg"
      m={1}
      mb={2}
      variant="solid"
      fontSize={12}
      colorscheme="purple"
      backgroundColor={"purple"}
      cursor="pointer"
      onClick={handleFunction}
    >
      {user.name}
      {"  "}

      <i class="fa-solid fa-xmark"></i>
    </Box>
  );
}

export default UserBadgeItem;
