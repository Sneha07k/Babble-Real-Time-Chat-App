import React, { useState } from "react";
import { VStack, Field, Input, Button } from "@chakra-ui/react";
import { PasswordInput } from "../ui/password-input";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
    const [profilePicture, setProfilePicture] = useState("");
    
  const submitHandler = () => {
    console.log({
      name,
      email,
      password,
      confirmPassword,
      profilePicture,
    });
  };
  return (
    <VStack gap={4} align="stretch" w="100%" p={4}>
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Input
          placeholder="Eddard Stark"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field.Root>

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

      <Field.Root>
        <Field.Label>Confirm Password</Field.Label>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Profile Picture</Field.Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePicture(e.target.files[0])}
        />
      </Field.Root>

      <Button colorScheme="blue" width="100%" mt={4} onClick={submitHandler}>
        Sign Up
      </Button>
    </VStack>
  );
};

export default Signup;
