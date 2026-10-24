import React, { useState } from "react";
import axios from "axios";
import { Box, Popover, Portal, Text } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import { THEMES } from "../../config/themes";
import { toaster } from "../ui/toaster";

// palette button in the chat header; the choice is shared with everyone in the chat
const ThemePicker = ({ trigger }) => {
  const { user, selectedChat, setSelectedChat, setChats } = ChatState();
  const [open, setOpen] = useState(false);
  const current = selectedChat?.theme || "default";

  const choose = async (key) => {
    if (key === current) return setOpen(false);
    const previous = current;
    // switch instantly; undo if the server says no
    const apply = (theme) => {
      setSelectedChat((prev) => (prev ? { ...prev, theme } : prev));
      setChats((prev) => prev.map((c) => (c._id === selectedChat._id ? { ...c, theme } : c)));
    };
    apply(key);
    setOpen(false);
    try {
      await axios.put(
        `/api/chat/${selectedChat._id}/theme`,
        { theme: key },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );
    } catch (error) {
      apply(previous);
      toaster.create({
        description: error.response?.data?.message || "Couldn't change the theme",
        type: "error",
      });
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)} positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            bg="var(--panel-strong)"
            border="1px solid rgba(255,255,255,0.1)"
            borderRadius="20px"
            boxShadow="0 16px 40px rgba(0,0,0,0.5)"
            w="300px"
            color="white"
          >
            <Popover.Body p={4}>
              <Text fontFamily="heading" fontWeight="600" fontSize="lg" mb={1}>
                Chat theme 🎨
              </Text>
              <Text fontSize="xs" color="gray.400" mb={3}>
                Everyone in this chat sees the new look.
              </Text>
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={3}>
                {Object.entries(THEMES).map(([key, theme]) => (
                  <Box
                    key={key}
                    as="button"
                    type="button"
                    onClick={() => choose(key)}
                    display="flex"
                    flexDir="column"
                    alignItems="center"
                    gap={1}
                    cursor="pointer"
                  >
                    <Box
                      w="52px"
                      h="52px"
                      borderRadius="16px"
                      bg={theme.swatch}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="22px"
                      outline={key === current ? "3px solid white" : "none"}
                      outlineOffset="2px"
                      transition="transform 0.15s"
                      _hover={{ transform: "scale(1.1)" }}
                    >
                      {theme.emoji}
                    </Box>
                    <Text fontSize="10px" color={key === current ? "white" : "gray.400"}>
                      {theme.name}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default ThemePicker;
