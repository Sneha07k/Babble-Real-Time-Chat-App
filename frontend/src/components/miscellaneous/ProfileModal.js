import React from "react";
import { Dialog, Portal, CloseButton, VStack } from "@chakra-ui/react";
import { Image, Text } from "@chakra-ui/react";
// import { VStack } from "@chakra-ui/react"; 
const ProfileModal = ({ user, open, setOpen }) => {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header
              fontFamily="Work Sans"
              fontSize="40px"
              d="flex"
              justifyContent="center"
            >
              {user?.name}
            </Dialog.Header>
            <Dialog.Body
              pt="6"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <VStack>
                <Image
                  src={user?.picture}
                  alt={user?.name}
                  borderRadius="full"
                  boxSize="150px"
                />

                <Text
                  fontSize="20px"
                  
                >Email : {user?.email}</Text>
              </VStack>
            </Dialog.Body>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ProfileModal;
