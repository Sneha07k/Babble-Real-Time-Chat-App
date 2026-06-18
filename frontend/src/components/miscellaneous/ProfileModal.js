import React from "react";
import { Dialog, Portal, CloseButton, VStack } from "@chakra-ui/react";
import { Image, Text } from "@chakra-ui/react";

const ProfileModal = ({ user, open, setOpen }) => {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />

        <Dialog.Positioner>
          <Dialog.Content
            bg="rgba(8,12,28,0.98)"
            color="white"
            borderRadius="20px"
            border="1px solid"
            borderColor="rgba(34,211,238,0.15)"
            backdropFilter="blur(20px)"
            boxShadow="0 20px 50px rgba(0,0,0,0.5)"
            maxW="420px"
          >
            <Dialog.Header
              display="flex"
              justifyContent="center"
              alignItems="center"
              fontSize="32px"
              fontWeight="700"
              color="white"
              pb={2}
            >
              {user?.name}
            </Dialog.Header>

            <Dialog.Body
              py={6}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <VStack gap={5}>
                <Image
                  src={user?.picture}
                  alt={user?.name}
                  borderRadius="full"
                  boxSize="160px"
                  objectFit="cover"
                  border="4px solid"
                  borderColor="rgba(34,211,238,0.4)"
                  boxShadow="0 0 25px rgba(34,211,238,0.15)"
                />

                <Text fontSize="lg" color="gray.300" textAlign="center">
                  {user?.email}
                </Text>
              </VStack>
            </Dialog.Body>

            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                color="gray.300"
                _hover={{
                  bg: "rgba(255,255,255,0.08)",
                }}
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ProfileModal;
