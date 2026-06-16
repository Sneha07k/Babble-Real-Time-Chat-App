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


  const guestCredentialsHandler = () => {
    setEmail("guest@example.com");
    setPassword("123456");
  };

  return (
    <VStack gap={4} align="stretch" w="100%" p={4}>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          placeholder="me@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Password</Field.Label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field.Root>

      <Button
        colorScheme="blue"
        width="100%"
        onClick={submitHandler}
        loading={loading}
      >
        Login
      </Button>

      <Button variant="outline" width="100%" onClick={guestCredentialsHandler}>
        Get Guest Credentials
      </Button>
    </VStack>
  );
};

export default Login;
