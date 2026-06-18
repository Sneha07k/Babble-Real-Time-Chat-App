import React, { useState } from "react";
import { VStack, Field, Input, Button } from "@chakra-ui/react";
import { PasswordInput } from "../ui/password-input";
import { toaster } from "../ui/toaster";
import axios from "axios";
import { useHistory } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const postDetails = (file) => {
    console.log("postDetails called");
    setLoading(true);

    if (!file) {
      toaster.create({
        description: "Please select a file",
        type: "warning",
        closable: true,
      });

      setLoading(false);
      return;
    }

    if (file.type === "image/jpeg" || file.type === "image/png") {
      const data = new FormData();

      data.append("file", file);
      data.append("upload_preset", "OGC-Mern-Chat-App");
      data.append("cloud_name", "dbkqtoa4t");

      fetch("https://api.cloudinary.com/v1_1/dbkqtoa4t/image/upload", {
        method: "POST",
        body: data,
      })
        .then((res) => {
          console.log("Status:", res.status);
          return res.json();
        })

        .then((data) => {
          console.log("Cloudinary Response:", data);

          setProfilePicture(data.secure_url);
          setLoading(false);
        })

        .catch((err) => {
          console.log("Upload Error:", err);
          setLoading(false);
        });
    } else {
      toaster.create({
        description: "Please select an image file (jpeg or png)",
        type: "warning",
        closable: true,
      });

      setLoading(false);
    }
  };

  const submitHandler = async () => {
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      toaster.create({
        description: "Please fill all the fields",
        type: "warning",
        closable: true,
      });

      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toaster.create({
        description: "Passwords do not match",
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

      console.log("profilePicture =", profilePicture);

      const { data } = await axios.post(
        "/api/user",
        {
          name,
          email,
          password,
          picture: profilePicture,
        },
        config,
      );

      toaster.create({
        description: "Registration successful",
        type: "success",
        closable: true,
      });

      localStorage.setItem("userInfo", JSON.stringify(data));

      setLoading(false);

      history.push("/chats");
    } catch (error) {
      toaster.create({
        description: "Registration failed",
        type: "error",
        closable: true,
      });

      setLoading(false);
    }
  };

  return (
    <VStack gap={5} align="stretch" w="100%" p={5}>
      <Field.Root>
        <Field.Label color="gray.300" fontWeight="medium">
          Name
        </Field.Label>

        <Input
          placeholder="Eddard Stark"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          Email
        </Field.Label>

        <Input
          type="email"
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

      <Field.Root>
        <Field.Label color="gray.300" fontWeight="medium">
          Confirm Password
        </Field.Label>

        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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

      <Field.Root>
        <Field.Label color="gray.300" fontWeight="medium">
          Profile Picture
        </Field.Label>

        <Input
          type="file"
          accept="image/*"
          onChange={(e) => postDetails(e.target.files[0])}
          bg="rgba(255,255,255,0.05)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.12)"
          color="gray.300"
          borderRadius="lg"
        />
      </Field.Root>

      <Button
        width="100%"
        mt={3}
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
        Sign Up
      </Button>
    </VStack>
  );
};

export default Signup;
