import React, { useState } from "react";
import {
  Dialog,
  Button,
  Portal,
  CloseButton,
  Field,
    Input,
  Box,
} from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import { toaster } from "../ui/toaster";
import axios from "axios";
import { Spinner } from "@chakra-ui/react";
import UserListItem from "../UserAvatar/UserListItem";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";

const GroupChatModal = ({ children }) => {
  const [groupChatName, setGroupChatName] = useState();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState();
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, chats, setChats } = ChatState();

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/user?search=${search}`, config);
      console.log(data);
      // console.log();

      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toaster.create({
        title: "Error Occured!",
        description: "Failed to load the search results",
        type: "error",
      });
    }
  };

  const handleSubmit = async () => { 
      
    if (!groupChatName || !selectedUsers) {
      toaster.create({
        title: "Please fill all the fields first",
        type: "error"
      })  
      return;
    }
    try {
       const config = {
         headers: {
           Authorization: `Bearer ${user.token}`,
         },
      };
      const { data } = await axios.post('/api/chat/group', {
        name: groupChatName,
        users: JSON.stringify(selectedUsers.map((u) => u._id))
      }, config
      );
      setChats([data, ...chats]);
      toaster.create({
        title: "New group chat created",
        type:"success"
      })
    } catch (error) {
       toaster.create({
         title: "Failed to create the group chat",
         type: "error"
       });
    }
    };
  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };
    
    const handleGroup = (userToAdd) => {
        if (selectedUsers.includes(userToAdd)) {
            toaster.create({
                title: "User already added",
                type:"info"
            })
            return;
      }
      setSelectedUsers([...selectedUsers, userToAdd]);
        // setSelectedUsers
    };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          size="sm"
          bg="gray.700"
          color="white"
          borderRadius="999px"
          px={5}
          border="1px solid"
          borderColor="gray.600"
          fontWeight="600"
          transition="all 0.2s ease"
          _hover={{
            bg: "gray.600",
            borderColor: "#1cb2c9",
            boxShadow: "0 0 15px rgba(28,178,201,0.2)",
            transform: "translateY(-1px)",
          }}
        >
          <i
            className="fa-solid fa-user-group"
            style={{ marginRight: "8px" }}
          />
          New Group
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="rgba(8,12,28,0.98)"
            color="white"
            borderRadius="20px"
            border="1px solid"
            borderColor="rgba(34,211,238,0.15)"
            backdropFilter="blur(20px)"
            boxShadow="0 20px 50px rgba(0,0,0,0.5)"
          >
            <Dialog.Header>
              <Dialog.Title
                fontSize={"35px"}
                fontFamily={"Work Sans"}
                d="flex"
                justifyContent={"center"}
              >
                Create Group Chat
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body d="flex" flexDir={"column"} alignItems={"center"}>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input
                  placeholder="Group Name"
                  mb={3}
                  onChange={(e) => setGroupChatName(e.target.value)}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Search User</Field.Label>
                <Input
                  placeholder="User name"
                  mb={1}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <Box w="100%" display={"flex"} flexWrap={"wrap"} pb={3}>
                  {selectedUsers.map((u) => (
                    <UserBadgeItem
                      key={u._id}
                      user={u}
                      handleFunction={() => handleDelete(u)}
                    />
                  ))}
                </Box>

                {loading ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Spinner />
                  </Box>
                ) : (
                  searchResult
                    ?.slice(0, 4)
                    .map((user) => (
                      <UserListItem
                        key={user._id}
                        user={user}
                        handleFunction={() => handleGroup(user)}
                      />
                    ))
                )}
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>

              <Button colorScheme={"blue"} onClick={handleSubmit}>
                Save
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default GroupChatModal;
