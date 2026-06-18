import React, { useState } from "react";
import { Dialog, SegmentGroupContext } from "@chakra-ui/react";
import { CloseButton, Button, Portal, Text,Box, Field,Input } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import { IconButton } from "@chakra-ui/react";
import { toaster } from "../ui/toaster";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import { Spinner } from "@chakra-ui/react";

// import { useState } from "react";
import axios from 'axios'
import UserListItem from "../UserAvatar/UserListItem";
const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages }) => {
  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const { selectedChat, user, setSelectedChat } = ChatState();
  const [renameLoading, setRenameLoading] = useState(false);


  const handleRemove = async (user1) => { 
    if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
      toaster.create({
        title: "Only admins can remove someone",
        type: "info"
      });
      return;
    }
    try {
      setLoading(true);
       const config = {
         headers: {
           Authorization: `Bearer ${user.token}`,
         },
      };
      
      const {data }= await axios.put(`/api/chat/groupRemove`, {
        chatId: selectedChat._id,
        userId: user1._id,
      }, config);
      if (user1._id === user._id) {
        setSelectedChat(null);
      } else {
        setSelectedChat(data);
      }
      setFetchAgain(!fetchAgain);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      toaster.create({
        title: "Error removing member",
        type: "error"
      });
    setLoading(false);

    }

  };


  const handleAddUser = async(user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      toaster.create({
        title: "User already present in the group",
        type: "info"
      });
      return;
    }
    if (selectedChat.groupAdmin._id !== user._id) {
      toaster.create({
        title: "Only the admin can add new members",
        type: "info"
      });
      return;
    }
    try {
      setLoading(true);
       const config = {
         headers: {
           Authorization: `Bearer ${user.token}`,
         },
      };
      const { data } = await axios.put('/api/chat/groupAdd', {
        chatId: selectedChat._id,
        userId: user1._id,
      }, config)
      setSelectedChat(data);
      setFetchAgain(!fetchAgain)
      setLoading(false);
      
    } catch (error) {
      toaster.create({
        title: "Error adding member",
        type:"error"
      })
      setLoading(false);
    }
  }
  const handleRename = async () => {
    if (!groupChatName) return;

    try {
      setRenameLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        "/api/chat/rename",
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        config,
      );
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (error) {
      toaster.create({
        title: "Error renaming group",
        type: "error",
      });
      setRenameLoading(false);
    }
    setGroupChatName("");
  };
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
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Text cursor="pointer" color="blue.300" fontSize={"25px"}>
          <i class="fa-solid fa-users"></i>
        </Text>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />
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
              <Dialog.Title>{selectedChat.chatName}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box w="100%" display={"flex"} flexWrap={"wrap"} pb={3}>
                {selectedChat.users.map((u) => (
                  <UserBadgeItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleRemove(u)}
                  />
                ))}
              </Box>

              <Box display="flex" alignItems="end" width="100%" pb={4}>
                <Field.Root flex="1" mr={2}>
                  <Field.Label>Group Name</Field.Label>
                  <Input
                    placeholder={selectedChat.chatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                  />
                </Field.Root>
                <Button
                  variant="solid"
                  colorScheme={"teal"}
                  backgroundColor={"teal.500"}
                  ml={1}
                  isLoading={renameLoading}
                  onClick={handleRename}
                  // mr={4}
                >
                  Update
                </Button>
              </Box>

              <Field.Root flex="1" mr={3}>
                <Field.Label>Add User to group</Field.Label>
                <Input
                  mb={3}
                  placeholder="Search Users"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Field.Root>

              {loading ? (
                <Spinner size="sm" mr={5} />
              ) : (
                searchResult.map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleAddUser(user)}
                  />
                ))
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => handleRemove(user)}
                  backgroundColor={"red"}
                >
                  Leave Group
                </Button>
              </Dialog.ActionTrigger>
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

export default UpdateGroupChatModal;
