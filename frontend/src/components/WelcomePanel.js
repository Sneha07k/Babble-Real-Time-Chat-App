import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Input, Spinner, Text } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { ChatState } from "../Context/ChatProvider";
import { toaster } from "./ui/toaster";

const cardProps = {
  display: "flex",
  flexDir: "column",
  gap: 3,
  p: 5,
  bg: "rgba(255,255,255,0.03)",
  border: "1px solid",
  borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
  borderRadius: "18px",
  color: "white",
};

const accentButton = {
  bg: "var(--accent)",
  color: "var(--on-accent)",
  fontWeight: "bold",
  borderRadius: "lg",
  _hover: { bg: "var(--accent-strong)" },
};

const CardTitle = ({ icon, children }) => (
  <Box display="flex" alignItems="center" gap={3}>
    <Box
      w="38px"
      h="38px"
      borderRadius="12px"
      bg="color-mix(in srgb, var(--accent) 12%, transparent)"
      color="var(--accent-light)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <i className={icon} />
    </Box>
    <Text fontWeight="700" fontSize="lg">
      {children}
    </Text>
  </Box>
);

// shown instead of an empty screen: someone to talk to, a way to
// bring friends in, and rooms that already have people in them
const WelcomePanel = () => {
  const { user, chats, setChats, setSelectedChat } = ChatState();

  const [inviteCode, setInviteCode] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    const config = { headers: { Authorization: `Bearer ${user.token}` } };

    axios
      .get("/api/user/invite", config)
      .then(({ data }) => setInviteCode(data.code))
      .catch(() => setInviteCode(""));

    setRoomsLoading(true);
    axios
      .get("/api/chat/community", config)
      .then(({ data }) => setRooms(data))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [user]);

  const inviteLink = inviteCode
    ? `${window.location.origin}/invite/${inviteCode}`
    : "";

  const botChat = chats.find(
    (c) => !c.isGroupChat && c.users.some((u) => u.isBot),
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toaster.create({ description: "Invite link copied", type: "success" });
    } catch (error) {
      toaster.create({ description: "Couldn't copy the link", type: "error" });
    }
  };

  const shareLink = () => {
    navigator
      .share({
        title: "Join me on Babble",
        text: `${user.name} invited you to chat on Babble`,
        url: inviteLink,
      })
      .catch(() => {});
  };

  const openRoom = async (room) => {
    const existing = chats.find((c) => c._id === room._id);
    if (existing) {
      setSelectedChat(existing);
      return;
    }

    try {
      setJoiningId(room._id);
      const { data } = await axios.put(
        `/api/chat/community/${room._id}/join`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } },
      );
      setChats((prev) =>
        prev.some((c) => c._id === data._id) ? prev : [data, ...prev],
      );
      setRooms((prev) =>
        prev.map((r) =>
          r._id === room._id && !r.joined
            ? { ...r, joined: true, memberCount: r.memberCount + 1 }
            : r,
        ),
      );
      setSelectedChat(data);
    } catch (error) {
      toaster.create({ description: "Couldn't join the room", type: "error" });
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Box w="100%" h="100%" overflowY="auto" px={{ base: 1, md: 4 }} py={4}>
      <Text
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="700"
        color="white"
      >
        Welcome, {user.name.split(" ")[0]} 👋
      </Text>
      <Text color="gray.400" mt={1} mb={6}>
        Here's how to get the conversation going.
      </Text>

      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
        gap={4}
        alignItems="start"
      >
        {/* BABBLE AI */}
        <Box {...cardProps}>
          <CardTitle icon="fa-solid fa-robot">Babble AI</CardTitle>
          <Text color="gray.400" fontSize="sm">
            Your always-online contact. Ask it anything, or ask how Babble
            works.
          </Text>
          <Button
            {...accentButton}
            disabled={!botChat}
            onClick={() => setSelectedChat(botChat)}
          >
            Say hi
          </Button>
        </Box>

        {/* INVITE */}
        <Box {...cardProps}>
          <CardTitle icon="fa-solid fa-user-plus">Invite a friend</CardTitle>
          <Text color="gray.400" fontSize="sm">
            Friends who join from your link land straight in a chat with you.
          </Text>

          <Input
            readOnly
            value={inviteLink || "Loading your link..."}
            onFocus={(e) => e.target.select()}
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.12)"
            color="gray.200"
            fontSize="sm"
            borderRadius="lg"
          />

          <Box display="flex" gap={2}>
            <Button
              {...accentButton}
              flex="1"
              disabled={!inviteLink}
              onClick={copyLink}
            >
              <i className="fa-solid fa-copy" /> Copy
            </Button>
            {navigator.share && (
              <Button
                flex="1"
                variant="outline"
                color="white"
                borderColor="rgba(255,255,255,0.2)"
                disabled={!inviteLink}
                onClick={shareLink}
              >
                <i className="fa-solid fa-share-nodes" /> Share
              </Button>
            )}
            <Button
              variant="outline"
              color="white"
              borderColor="rgba(255,255,255,0.2)"
              disabled={!inviteLink}
              onClick={() => setShowQR((prev) => !prev)}
              aria-label="Show QR code"
            >
              <i className="fa-solid fa-qrcode" />
            </Button>
          </Box>

          {showQR && inviteLink && (
            // QR codes need a light background to scan reliably
            <Box alignSelf="center" bg="white" p={3} borderRadius="12px">
              <QRCodeSVG value={inviteLink} size={150} />
            </Box>
          )}
        </Box>

        {/* COMMUNITY ROOMS */}
        <Box {...cardProps}>
          <CardTitle icon="fa-solid fa-people-group">Community rooms</CardTitle>
          <Text color="gray.400" fontSize="sm">
            Open rooms where anyone on Babble can talk.
          </Text>

          {roomsLoading ? (
            <Spinner color="var(--accent-light)" alignSelf="center" />
          ) : (
            rooms.map((room) => (
              <Box
                key={room._id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={2}
                px={3}
                py={2}
                borderRadius="12px"
                bg="rgba(255,255,255,0.04)"
              >
                <Box overflow="hidden">
                  <Text fontWeight="600" fontSize="sm">
                    # {room.chatName}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {room.memberCount} member{room.memberCount === 1 ? "" : "s"}
                  </Text>
                </Box>
                <Button
                  size="xs"
                  {...(room.joined
                    ? {
                        variant: "outline",
                        color: "white",
                        borderColor: "rgba(255,255,255,0.2)",
                      }
                    : accentButton)}
                  loading={joiningId === room._id}
                  onClick={() => openRoom(room)}
                >
                  {room.joined ? "Open" : "Join"}
                </Button>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default WelcomePanel;
