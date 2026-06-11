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
          variant="outline"
          size="sm"
          backgroundColor={"white"}
          color={"black"}
        >
          New Group Chat
          <i class="fa-solid fa-plus"></i>
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
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

                {selectedUsers.map((u) => (
                  <UserBadgeItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleDelete(u)}
                  />
                ))}

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
