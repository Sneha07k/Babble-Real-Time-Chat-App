import React from 'react'
import {useEffect } from "react";
import { useHistory } from "react-router-dom";
import babbleLogo from "../babble_logo.svg";
import {
  Box,
  Tabs,
  Container,
} from "@chakra-ui/react";
import Login from '../components/Authentication/Login';
import Signup from '../components/Authentication/Signup';
// import { Tabs } from "@chakra-ui/react";


const Homepage = () => {
 const history = useHistory();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("userInfo"));
      
        if (user) {
            history.push("/chats");
        }
    }, [history]);

  
  return (
    <Container maxW="xl" centerContent>
      <Box
        d="flex"
        justifyContent="center"
        pl= {20}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="rgba(61, 59, 59, 0)"
      >
        <img src={babbleLogo} alt="Babble Logo" p={0}  width="2000" />
      </Box>
      <Box
        d="flex"
        justifyContent="center"
        p={0}
        bg="rgba(61, 59, 59, 0.8)"
        w="100%"
        m="0px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
      >
        <Tabs.Root defaultValue="login" colorScheme="cyan" h="100%" w="100%" p={1}>
          <Tabs.List>
            <Tabs.Trigger value="login" width="50%" d="flex" justifyContent="center">
              Login
            </Tabs.Trigger>
            <Tabs.Trigger value="signup" width="50%" d="flex" justifyContent="center">
              Sign Up
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="login"><Login /></Tabs.Content>

          <Tabs.Content value="signup"><Signup /></Tabs.Content>
        </Tabs.Root>
      </Box>
    </Container>
  );
}

export default Homepage
