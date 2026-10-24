import React from "react";
import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import BabbleLogo from "../components/BabbleLogo";
import { Avatar, Box, Tabs, Text } from "@chakra-ui/react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import GoogleAuthButton from "../components/Authentication/GoogleAuthButton";

const Homepage = () => {
  const history = useHistory();
  const location = useLocation();
  // set when someone arrives through a friend's invite link
  const inviteCode = new URLSearchParams(location.search).get("invite");
  const [inviter, setInviter] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) {
      history.push(inviteCode ? `/invite/${inviteCode}` : "/chats");
    }
  }, [history, inviteCode]);

  useEffect(() => {
    if (!inviteCode) return;
    axios
      .get(`/api/user/invite/${encodeURIComponent(inviteCode)}`)
      .then(({ data }) => setInviter(data))
      .catch(() => setInviter(null));
  }, [inviteCode]);

  return (
    <Box
      minH="100dvh"
      w="100%"
      display="flex"
      flexDir={{ base: "column", lg: "row" }}
      alignItems="center"
      justifyContent="center"
      gap={{ base: 6, lg: 16 }}
      px={4}
      py={{ base: 8, lg: 10 }}
      position="relative"
      overflow="hidden"
    >
      {/* soft colour blobs in the background */}
      <Box position="absolute" w="420px" h="420px" borderRadius="full" bg="var(--c1)" filter="blur(120px)" opacity={0.35} top="-120px" left="-120px" pointerEvents="none" />
      <Box position="absolute" w="380px" h="380px" borderRadius="full" bg="var(--c2)" filter="blur(120px)" opacity={0.25} bottom="-120px" right="-80px" pointerEvents="none" />

      {/* HERO */}
      <Box maxW="460px" textAlign={{ base: "center", lg: "left" }} position="relative">
        <BabbleLogo size={64} />
        <Text
          fontFamily="heading"
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="700"
          lineHeight="1.15"
          mt={6}
          color="white"
        >
          Chat, share and hang out with people{" "}
          <Box
            as="span"
            bg="linear-gradient(90deg, var(--accent-light), var(--highlight))"
            bgClip="text"
            color="transparent"
          >
            everywhere
          </Box>{" "}
          🌍
        </Text>
        <Box
          display={{ base: "none", md: "flex" }}
          flexWrap="wrap"
          gap={2}
          mt={6}
          justifyContent={{ base: "center", lg: "flex-start" }}
        >
          {["📷 Photos & videos", "🎤 Voice notes", "🎨 Chat themes", "🤖 AI buddy", "🌍 Global rooms", "✓✓ Read receipts"].map((f) => (
            <Text
              key={f}
              as="span"
              px={3}
              py="6px"
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              color="gray.100"
              bg="rgba(255,255,255,0.08)"
              border="1px solid rgba(255,255,255,0.1)"
            >
              {f}
            </Text>
          ))}
        </Box>
      </Box>

      <Box w={{ base: "100%", md: "440px" }} maxW="440px" position="relative">
        {inviter && (
          <Box
            className="babble-pop"
            mb={4}
            px={4}
            py={3}
            display="flex"
            alignItems="center"
            gap={3}
            borderRadius="20px"
            bg="color-mix(in srgb, var(--accent) 18%, transparent)"
            border="1px solid"
            borderColor="color-mix(in srgb, var(--accent) 40%, transparent)"
          >
            <Avatar.Root size="sm">
              <Avatar.Image src={inviter.picture} />
              <Avatar.Fallback name={inviter.name} />
            </Avatar.Root>
            <Text color="gray.100" fontSize="sm">
              <b>{inviter.name}</b> invited you to Babble 💌 Sign up and you'll
              be chatting with them straight away.
            </Text>
          </Box>
        )}

        {/* AUTH CARD */}
        <Box
          bg="var(--panel)"
          backdropFilter="blur(18px)"
          borderRadius="28px"
          border="1px solid rgba(255,255,255,0.1)"
          boxShadow="0 25px 60px rgba(0,0,0,0.5)"
        >
          <Tabs.Root defaultValue={inviteCode ? "signup" : "login"} w="100%" p={3} variant="plain">
            <Tabs.List bg="rgba(0,0,0,0.25)" borderRadius="full" p="4px" w="100%">
              {[
                ["login", "Log in"],
                ["signup", "Sign up"],
              ].map(([value, label]) => (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  flex="1"
                  justifyContent="center"
                  borderRadius="full"
                  color="gray.400"
                  fontWeight="700"
                  _selected={{ bg: "var(--gradient)", color: "white" }}
                  _hover={{ color: "white" }}
                >
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="login">
              <Login inviteCode={inviteCode} />
            </Tabs.Content>

            <Tabs.Content value="signup">
              <Signup inviteCode={inviteCode} />
            </Tabs.Content>
          </Tabs.Root>

          <GoogleAuthButton inviteCode={inviteCode} />
        </Box>
      </Box>
    </Box>
  );
};

export default Homepage;
