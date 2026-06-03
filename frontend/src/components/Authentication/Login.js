import React, { useState } from "react";
import { VStack, Field, Input, Button } from "@chakra-ui/react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitHandler = () => {
    console.log(email, password);
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
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field.Root>

      <Button colorScheme="blue" width="100%" onClick={submitHandler}>
        Login
      </Button>

      <Button variant="outline" width="100%" onClick={guestCredentialsHandler}>
        Get Guest Credentials
      </Button>
    </VStack>
  );
};

export default Login;
