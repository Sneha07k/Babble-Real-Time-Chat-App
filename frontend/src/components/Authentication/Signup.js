import React, { useState } from "react";
import { VStack, Field, Input, Button } from "@chakra-ui/react";
import { PasswordInput } from "../ui/password-input";
// import { Button } from "@chakra-ui/react"
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
  // const toast= useToast()
    
  
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

    const submitHandler = async() => {
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

      if(password !== confirmPassword) {
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
        }
        console.log("profilePicture =", profilePicture);
        const { data }=await axios.post(
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
      }catch (error) {
        toaster.create({
          description: "Registration failed",
          type: "error",
          closable: true,
        });
        setLoading(false);
      }
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
            onChange={(e) => postDetails(e.target.files[0])}
          />
        </Field.Root>

        <Button colorScheme="blue" width="100%" mt={4} onClick={submitHandler} isLoading={loading}>
          Sign Up
        </Button>
      </VStack>
    );
  };


export default Signup;
