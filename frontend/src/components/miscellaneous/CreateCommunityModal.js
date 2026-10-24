import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  Input,
  Portal,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import { toaster } from "../ui/toaster";

// keep in sync with COMMUNITY_CATEGORIES in backend/config/constants.js
const CATEGORIES = [
  "Hangout",
  "Study",
  "Tech",
  "Gaming",
  "Music",
  "Movies & TV",
  "Sports",
  "Travel",
  "Art",
  "Food",
];
const EMOJIS = ["💬", "🔥", "🎮", "🎧", "📚", "💻", "🍿", "⚽", "✈️", "🎨", "🍜", "🌱", "🐶", "🚀", "😂", "💜"];

const fieldInput = {
  bg: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  borderRadius: "12px",
  _placeholder: { color: "gray.500" },
  _focus: { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" },
};

const CreateCommunityModal = ({ children, onCreated }) => {
  const { user } = ChatState();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("💬");
  const [category, setCategory] = useState("Hangout");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setEmoji("💬");
    setCategory("Hangout");
  };

  const create = async () => {
    try {
      setSaving(true);
      const { data } = await axios.post(
        "/api/chat/community",
        { name, description, emoji, category },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );
      toaster.create({ description: `${data.emoji} ${data.chatName} is live! 🎉`, type: "success" });
      reset();
      setOpen(false);
      onCreated?.(data);
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Couldn't create the community",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.65)" backdropFilter="blur(6px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="var(--panel-strong)"
            color="white"
            borderRadius="24px"
            border="1px solid rgba(255,255,255,0.1)"
            boxShadow="0 20px 50px rgba(0,0,0,0.5)"
            mx={3}
          >
            <Dialog.Header>
              <Dialog.Title fontFamily="heading" fontSize="2xl" fontWeight="600">
                Create a community ✨
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body display="flex" flexDir="column" gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2} color="gray.300">
                  Pick an icon
                </Text>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {EMOJIS.map((e) => (
                    <Box
                      key={e}
                      as="button"
                      type="button"
                      w="40px"
                      h="40px"
                      fontSize="20px"
                      borderRadius="12px"
                      bg={emoji === e ? "var(--gradient)" : "rgba(255,255,255,0.06)"}
                      transform={emoji === e ? "scale(1.1)" : undefined}
                      transition="all 0.15s"
                      onClick={() => setEmoji(e)}
                    >
                      {e}
                    </Box>
                  ))}
                </Box>
              </Box>

              <Field.Root>
                <Field.Label color="gray.300">Name</Field.Label>
                <Input
                  placeholder="e.g. Night Owls"
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  {...fieldInput}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color="gray.300">What's it about?</Field.Label>
                <Textarea
                  placeholder="A short description people see on Explore"
                  maxLength={160}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  {...fieldInput}
                />
              </Field.Root>

              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2} color="gray.300">
                  Category
                </Text>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {CATEGORIES.map((c) => (
                    <Box
                      key={c}
                      as="button"
                      type="button"
                      px={3}
                      py="6px"
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="600"
                      bg={category === c ? "white" : "rgba(255,255,255,0.07)"}
                      color={category === c ? "#1a1033" : "gray.200"}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="ghost" color="gray.300" _hover={{ bg: "rgba(255,255,255,0.08)" }}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                bg="var(--gradient)"
                color="white"
                fontWeight="700"
                borderRadius="full"
                loading={saving}
                disabled={name.trim().length < 3}
                onClick={create}
                _hover={{ bg: "var(--gradient-hover)" }}
              >
                Create
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="gray.300" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default CreateCommunityModal;
