import React from "react";
import axios from "axios";
import { Box, Text } from "@chakra-ui/react";
import { GoogleLogin } from "@react-oauth/google";
import { useHistory } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";
import { toaster } from "../ui/toaster";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// works for both new and returning users; the backend decides which
const GoogleAuthButton = ({ inviteCode }) => {
  const { setUser } = ChatState();
  const history = useHistory();

  if (!GOOGLE_CLIENT_ID) return null;

  const onSuccess = async ({ credential }) => {
    try {
      const { data } = await axios.post("/api/user/google", { credential });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      history.push(inviteCode ? `/invite/${inviteCode}` : "/chats");
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Google sign-in failed",
        type: "error",
        closable: true,
      });
    }
  };

  return (
    <Box px={5} pb={5}>
      <Box display="flex" alignItems="center" gap={3} mb={4}>
        <Box flex="1" h="1px" bg="rgba(255,255,255,0.1)" />
        <Text color="gray.500" fontSize="sm">
          or
        </Text>
        <Box flex="1" h="1px" bg="rgba(255,255,255,0.1)" />
      </Box>

      <Box display="flex" justifyContent="center">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() =>
            toaster.create({
              description: "Google sign-in was cancelled or failed",
              type: "error",
            })
          }
          theme="filled_black"
          shape="pill"
          text="continue_with"
        />
      </Box>
    </Box>
  );
};

export default GoogleAuthButton;
