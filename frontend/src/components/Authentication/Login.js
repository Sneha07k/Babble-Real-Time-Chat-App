import React, { useState } from "react";
import { VStack, Field, Input, Button } from "@chakra-ui/react";
import { toaster } from "../ui/toaster";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { PasswordInput } from "../ui/password-input";
import { ChatState } from "../../Context/ChatProvider";
import OtpStep from "./OtpStep";

const Login = ({ inviteCode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // set when the account has two-step verification turned on
  const [otpEmail, setOtpEmail] = useState(null);

  const { setUser } = ChatState();
  const history = useHistory();

  const finishLogin = (data) => {
    toaster.create({
      description: "Login successful",
      type: "success",
      closable: true,
    });

    localStorage.setItem("userInfo", JSON.stringify(data));

    setEmail("");
    setPassword("");
    setOtpEmail(null);

    setUser(data);

    history.push(inviteCode ? `/invite/${inviteCode}` : "/chats");
  };

  const verifyCode = async (otp) => {
    try {
      setLoading(true);
      const { data } = await axios.post("/api/user/login/verify", {
        email: otpEmail,
        otp,
      });
      finishLogin(data);
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Verification failed",
        type: "error",
        closable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = async () => {
    setLoading(true);

    if (!email || !password) {
      toaster.create({
        description: "Please fill all the fields",
        type: "warning",
        closable: true,
      });

      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/user/login",
        {
          email,
          password,
        },
        config,
      );

      setLoading(false);

      if (data.twoFactorRequired) {
        setOtpEmail(data.email);
        toaster.create({
          description: `We sent a code to ${data.email}`,
          type: "info",
          closable: true,
        });
        return;
      }

      finishLogin(data);
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Login failed",
        type: "error",
        closable: true,
      });

      setLoading(false);
    }
  };

  if (otpEmail) {
    return (
      <OtpStep
        email={otpEmail}
        loading={loading}
        onVerify={verifyCode}
        // logging in again re-sends the code (at most once a minute)
        onResend={submitHandler}
        onBack={() => setOtpEmail(null)}
      />
    );
  }

  return (
    <VStack as="form" autoComplete="off" gap={5} align="stretch" w="100%" p={5}>
      <Field.Root>
        <Field.Label color="gray.300" fontWeight="medium">
          Email
        </Field.Label>

        <Input
          type="email"
          name="login_email_babble"
          autoComplete="off"
          placeholder="me@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          bg="rgba(255,255,255,0.05)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.12)"
          color="white"
          borderRadius="lg"
          _placeholder={{
            color: "gray.500",
          }}
          _focus={{
            borderColor: "var(--accent-light)",
            boxShadow: "0 0 0 1px var(--accent)",
          }}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label color="gray.300" fontWeight="medium">
          Password
        </Field.Label>

        <PasswordInput
          name="login_password_babble"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          bg="rgba(255,255,255,0.05)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.12)"
          color="white"
          borderRadius="lg"
          _focus={{
            borderColor: "var(--accent-light)",
            boxShadow: "0 0 0 1px var(--accent)",
          }}
        />
      </Field.Root>

      <Button
        width="100%"
        onClick={submitHandler}
        loading={loading}
        bg="var(--accent)"
        color="var(--on-accent)"
        fontWeight="bold"
        borderRadius="lg"
        _hover={{
          bg: "var(--accent-strong)",
          transform: "translateY(-1px)",
        }}
        transition="all 0.2s"
      >
        Login
      </Button>
    </VStack>
  );
};

export default Login;
