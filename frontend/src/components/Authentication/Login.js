import React, { useState } from "react";
import { VStack, Field, Input, Button } from "@chakra-ui/react";
import { toaster } from "../ui/toaster";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { PasswordInput } from "../ui/password-input";
import { ChatState } from "../../Context/ChatProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = ChatState();
  const history = useHistory();

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

      toaster.create({
        description: "Login successful",
        type: "success",
        closable: true,
      });

      localStorage.setItem("userInfo", JSON.stringify(data));

      setEmail("");
      setPassword("");

      setUser(data);

      setLoading(false);

      history.push("/chats");
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Login failed",
        type: "error",
        closable: true,
      });

      setLoading(false);
    }
  };

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
            borderColor: "#22D3EE",
            boxShadow: "0 0 0 1px #22D3EE",
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
            borderColor: "#22D3EE",
            boxShadow: "0 0 0 1px #22D3EE",
          }}
        />
      </Field.Root>

      <Button
        width="100%"
        onClick={submitHandler}
        loading={loading}
        bg="#22D3EE"
        color="#0B0D12"
        fontWeight="bold"
        borderRadius="lg"
        _hover={{
          bg: "#06B6D4",
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
