import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Input, Text } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { ChatState } from "../Context/ChatProvider";
import { toaster } from "./ui/toaster";

const Card = ({ color, icon, title, children }) => (
  <Box
    className="babble-pop"
    display="flex"
    flexDir="column"
    gap={3}
    p={5}
    bg="rgba(255,255,255,0.04)"
    border="1px solid rgba(255,255,255,0.08)"
    borderRadius="24px"
    color="white"
    transition="transform 0.15s"
    _hover={{ transform: "translateY(-3px)" }}
  >
    <Box display="flex" alignItems="center" gap={3}>
      <Box
        w="46px"
        h="46px"
        borderRadius="16px"
        bg={color}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="22px"
        flexShrink={0}
        boxShadow="0 6px 18px rgba(0,0,0,0.3)"
      >
        {icon}
      </Box>
      <Text fontFamily="heading" fontWeight="600" fontSize="xl">
        {title}
      </Text>
    </Box>
    {children}
  </Box>
);

const gradientButton = {
  bg: "var(--gradient)",
  color: "white",
  fontWeight: "700",
  borderRadius: "full",
  _hover: { bg: "var(--gradient-hover)" },
};

const ghostButton = {
  variant: "outline",
  color: "white",
  borderColor: "rgba(255,255,255,0.2)",
  borderRadius: "full",
  _hover: { bg: "rgba(255,255,255,0.08)" },
};

// shown instead of an empty screen: someone to talk to, a way to
// bring friends in, and rooms full of people to explore
const WelcomePanel = ({ setView }) => {
  const { user, chats, setChats, setSelectedChat } = ChatState();

  const [inviteCode, setInviteCode] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [rolling, setRolling] = useState(false);

  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => {
    axios
      .get("/api/user/invite", config)
      .then(({ data }) => setInviteCode(data.code))
      .catch(() => setInviteCode(""));
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
      toaster.create({ description: "Invite link copied 📋", type: "success" });
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

  const surpriseMe = async () => {
    try {
      setRolling(true);
      const { data } = await axios.post("/api/chat/community/random", {}, config);
      setChats((prev) => (prev.some((c) => c._id === data._id) ? prev : [data, ...prev]));
      setSelectedChat(data);
      toaster.create({ description: `🎲 You landed in ${data.emoji || ""} ${data.chatName}!`, type: "success" });
    } catch (error) {
      toaster.create({ description: error.response?.data?.message || "Couldn't find a room", type: "info" });
    } finally {
      setRolling(false);
    }
  };

  return (
    <Box w="100%" h="100%" overflowY="auto" px={{ base: 1, md: 6 }} py={{ base: 2, md: 6 }}>
      <Text fontFamily="heading" fontSize={{ base: "3xl", md: "4xl" }} fontWeight="700" color="white" lineHeight="1.1">
        Hey {user.name.split(" ")[0]}! 👋
      </Text>
      <Text color="gray.400" mt={2} mb={6}>
        Pick a chat on the left, or start something new.
      </Text>

      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
        gap={4}
        alignItems="start"
      >
        <Card color="var(--gradient)" icon="🤖" title="Babble AI">
          <Text color="gray.300" fontSize="sm">
            Your always-online buddy. Ask it anything, or ask how Babble works.
          </Text>
          <Button {...gradientButton} disabled={!botChat} onClick={() => setSelectedChat(botChat)}>
            Say hi 👋
          </Button>
        </Card>

        <Card color="linear-gradient(135deg, #f97316, #eab308)" icon="💌" title="Invite a friend">
          <Text color="gray.300" fontSize="sm">
            Friends who join from your link land straight in a chat with you.
          </Text>

          <Input
            readOnly
            value={inviteLink || "Loading your link..."}
            onFocus={(e) => e.target.select()}
            bg="rgba(255,255,255,0.05)"
            border="1px solid rgba(255,255,255,0.12)"
            color="gray.200"
            fontSize="sm"
            borderRadius="full"
          />

          <Box display="flex" gap={2}>
            <Button {...gradientButton} flex="1" disabled={!inviteLink} onClick={copyLink}>
              <i className="fa-solid fa-copy" /> Copy
            </Button>
            {navigator.share && (
              <Button {...ghostButton} flex="1" disabled={!inviteLink} onClick={shareLink}>
                <i className="fa-solid fa-share-nodes" /> Share
              </Button>
            )}
            <Button
              {...ghostButton}
              disabled={!inviteLink}
              onClick={() => setShowQR((prev) => !prev)}
              aria-label="Show QR code"
            >
              <i className="fa-solid fa-qrcode" />
            </Button>
          </Box>

          {showQR && inviteLink && (
            // QR codes need a light background to scan reliably
            <Box alignSelf="center" bg="white" p={3} borderRadius="16px" className="babble-pop">
              <QRCodeSVG value={inviteLink} size={150} />
            </Box>
          )}
        </Card>

        <Card color="linear-gradient(135deg, #0ea5e9, #6366f1)" icon="🌍" title="Explore">
          <Text color="gray.300" fontSize="sm">
            Rooms for gaming, music, study, food and more, with people from everywhere.
          </Text>
          <Button {...gradientButton} onClick={() => setView?.("explore")}>
            Browse communities
          </Button>
          <Button {...ghostButton} loading={rolling} onClick={surpriseMe}>
            🎲 Surprise me
          </Button>
        </Card>
      </Box>
    </Box>
  );
};

export default WelcomePanel;
