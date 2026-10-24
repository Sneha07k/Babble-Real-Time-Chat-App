import React from "react";
import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import babbleLogo from "../babble_logo.svg";
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
      minH="100vh"
      w="100%"
      bg="linear-gradient(135deg, #0B0D12 0%, #141824 100%)"
      display="flex"
      flexDirection="column"
      alignItems="center"
      py={10}
    >
      {/* Logo only */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        w="100%"
        mb={12}
      >
        <img
          src={babbleLogo}
          alt="Babble Logo"
          width="400"
          style={{ maxWidth: "80vw", height: "auto" }}
        />
      </Box>

      {inviter && (
        <Box
          w={{ base: "90%", md: "450px" }}
          mb={4}
          px={4}
          py={3}
          display="flex"
          alignItems="center"
          gap={3}
          borderRadius="xl"
          bg="rgba(34,211,238,0.08)"
          border="1px solid"
          borderColor="rgba(34,211,238,0.25)"
        >
          <Avatar.Root size="sm">
            <Avatar.Image src={inviter.picture} />
            <Avatar.Fallback name={inviter.name} />
          </Avatar.Root>
          <Text color="gray.200" fontSize="sm">
            <b>{inviter.name}</b> invited you to Babble. Sign up and you'll
            be chatting with them straight away.
          </Text>
        </Box>
      )}

      {/* Auth Card */}
      <Box
        w={{ base: "90%", md: "450px" }}
        bg="rgba(20,22,28,0.85)"
        backdropFilter="blur(18px)"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="rgba(255,255,255,0.08)"
        boxShadow="
          0 25px 50px rgba(0,0,0,0.55),
          0 0 20px rgba(34,211,238,0.08)
        "
      >
        <Tabs.Root defaultValue={inviteCode ? "signup" : "login"} colorScheme="cyan" w="100%" p={2}>
          <Tabs.List
            borderColor="rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.02)"
            borderRadius="xl"
          >
            <Tabs.Trigger
              value="login"
              width="50%"
              display="flex"
              justifyContent="center"
              color="gray.400"
              fontWeight="bold"
              _selected={{
                color: "#22D3EE",
                borderColor: "#22D3EE",
              }}
              _hover={{
                color: "gray.200",
              }}
            >
              Login
            </Tabs.Trigger>

            <Tabs.Trigger
              value="signup"
              width="50%"
              display="flex"
              justifyContent="center"
              color="gray.400"
              fontWeight="bold"
              _selected={{
                color: "#22D3EE",
                borderColor: "#22D3EE",
              }}
              _hover={{
                color: "gray.200",
              }}
            >
              Sign Up
            </Tabs.Trigger>
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
  );
};

export default Homepage;
