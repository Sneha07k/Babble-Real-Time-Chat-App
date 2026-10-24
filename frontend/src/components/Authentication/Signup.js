import React, { useRef, useState } from "react";
import {
  VStack,
  Field,
  Input,
  Button,
  Avatar,
  Box,
  Text,
} from "@chakra-ui/react";
import { PasswordInput } from "../ui/password-input";
import { toaster } from "../ui/toaster";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";
import OtpStep from "./OtpStep";

const Signup = ({ inviteCode }) => {
  const { setUser } = ChatState();
  // "details" (the form) -> "verify" (enter the emailed code)
  const [step, setStep] = useState("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const history = useHistory();

  const postDetails = (file) => {
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      toaster.create({
        description: "Please select an image file (jpeg or png)",
        type: "warning",
        closable: true,
      });
      return;
    }

    setUploading(true);

    const data = new FormData();

    data.append("file", file);
    data.append("upload_preset", "OGC-Mern-Chat-App");
    data.append("cloud_name", "dbkqtoa4t");

    fetch("https://api.cloudinary.com/v1_1/dbkqtoa4t/image/upload", {
      method: "POST",
      body: data,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.secure_url) throw new Error(data.error?.message);
        setProfilePicture(data.secure_url);
      })
      .catch(() => {
        toaster.create({
          description: "Photo upload failed. You can add one later.",
          type: "error",
          closable: true,
        });
      })
      .finally(() => setUploading(false));
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

    if (password.length < 8) {
      toaster.create({
        description: "Password must be at least 8 characters",
        type: "warning",
        closable: true,
      });

      setLoading(false);
      return;
    }

    await sendCode();
  };

  // step 1: email a verification code
  const sendCode = async () => {
    try {
      setLoading(true);
      await axios.post("/api/user/otp/signup", { email });
      setStep("verify");
      toaster.create({
        description: `We sent a code to ${email}`,
        type: "success",
        closable: true,
      });
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Couldn't send the code",
        type: "error",
        closable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // step 2: create the account with the code
  const verifyAndRegister = async (otp) => {
    setLoading(true);

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/user",
        {
          name,
          email,
          password,
          picture: profilePicture,
          otp,
        },
        config,
      );

      toaster.create({
        description: "Registration successful",
        type: "success",
        closable: true,
      });

      localStorage.setItem("userInfo", JSON.stringify(data));

      setUser(data);

      setLoading(false);

      history.push(inviteCode ? `/invite/${inviteCode}` : "/chats");
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Registration failed",
        type: "error",
        closable: true,
      });

      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <OtpStep
        email={email}
        loading={loading}
        onVerify={verifyAndRegister}
        onResend={sendCode}
        onBack={() => setStep("details")}
      />
    );
  }

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
            borderColor: "var(--accent-light)",
            boxShadow: "0 0 0 1px var(--accent)",
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
            borderColor: "var(--accent-light)",
            boxShadow: "0 0 0 1px var(--accent)",
          }}
        />
      </Field.Root>

      <Box display="flex" alignItems="center" gap={4}>
        <Avatar.Root size="lg">
          <Avatar.Image src={profilePicture || undefined} />
          <Avatar.Fallback name={name || undefined} />
        </Avatar.Root>

        <Box>
          <Button
            size="sm"
            variant="outline"
            color="white"
            borderColor="rgba(255,255,255,0.2)"
            _hover={{ bg: "rgba(255,255,255,0.08)" }}
            loading={uploading}
            loadingText="Uploading..."
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fa-solid fa-camera" />
            {profilePicture ? "Change photo" : "Upload photo"}
          </Button>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Optional · JPG or PNG
          </Text>
        </Box>

        {/* the real file picker stays hidden behind the button above */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={(e) => postDetails(e.target.files[0])}
        />
      </Box>

      <Button
        width="100%"
        mt={3}
        onClick={submitHandler}
        loading={loading}
        disabled={uploading}
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
        Sign Up
      </Button>
    </VStack>
  );
};

export default Signup;
