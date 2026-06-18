import React from "react";
import { useEffect } from "react";
import { useHistory } from "react-router-dom";
import babbleLogo from "../babble_logo.svg";
import { Box, Tabs } from "@chakra-ui/react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

const Homepage = () => {
  const history = useHistory();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) {
      history.push("/chats");
    }
  }, [history]);

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
        <img src={babbleLogo} alt="Babble Logo" width="400" />
      </Box>

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
        <Tabs.Root defaultValue="login" colorScheme="cyan" w="100%" p={2}>
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
            <Login />
          </Tabs.Content>

          <Tabs.Content value="signup">
            <Signup />
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Box>
  );
};

export default Homepage;
