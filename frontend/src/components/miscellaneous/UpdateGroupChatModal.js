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
  // groupAdmin is a full user object or, for chats that arrived live, just an id
  const adminId = selectedChat.groupAdmin?._id || selectedChat.groupAdmin;


  const handleRemove = async (user1) => { 
    if (adminId !== user._id && user1._id !== user._id) {
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
        title: error.response?.data?.message || "Error removing member",
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
    if (adminId !== user._id) {
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
        title: error.response?.data?.message || "Error adding member",
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
        title: error.response?.data?.message || "Error renaming group",
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
      const { data } = await axios.get(
        `/api/user?search=${encodeURIComponent(query)}`,
        config,
      );
      // console.log();

      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      setLoading(false);
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
        <Box
          as="button"
          type="button"
          title="Group settings"
          aria-label="Group settings"
          w="38px"
          h="38px"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
          color="gray.300"
          bg="rgba(255,255,255,0.06)"
          cursor="pointer"
          _hover={{ bg: "rgba(255,255,255,0.12)", color: "white" }}
        >
          <i className="fa-solid fa-users"></i>
        </Box>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="var(--panel-strong)"
            color="white"
            borderRadius="20px"
            border="1px solid"
            borderColor="color-mix(in srgb, var(--accent) 15%, transparent)"
            backdropFilter="blur(20px)"
            boxShadow="0 20px 50px rgba(0,0,0,0.5)"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="xl" fontWeight="700">
                {selectedChat.chatName}
              </Dialog.Title>
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
                  bg="var(--accent)"
                  color="var(--on-accent)"
                  fontWeight="600"
                  _hover={{ bg: "var(--accent-strong)" }}
                  ml={1}
                  loading={renameLoading}
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
                  onClick={() => handleRemove(user)}
                  bg="rgba(239,68,68,0.12)"
                  color="#FCA5A5"
                  border="1px solid rgba(239,68,68,0.3)"
                  fontWeight="600"
                  _hover={{ bg: "rgba(239,68,68,0.22)", color: "#FECACA" }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket" />
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
