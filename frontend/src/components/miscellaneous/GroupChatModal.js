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
  const [open, setOpen] = useState(false);

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

  const resetForm = () => {
    setGroupChatName("");
    setSelectedUsers([]);
    setSearch("");
    setSearchResult([]);
  };

  const handleSubmit = async () => {

    if (!groupChatName?.trim()) {
      toaster.create({
        title: "Please enter a group name",
        type: "error"
      })
      return;
    }
    if (selectedUsers.length < 2) {
      toaster.create({
        title: "Add at least 2 people to make a group",
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
      resetForm();
      setOpen(false);
    } catch (error) {
       toaster.create({
         title: error.response?.data?.message || "Failed to create the group chat",
         type: "error"
       });
    }
    };
  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };
    
    const handleGroup = (userToAdd) => {
        // compare ids: each search returns fresh objects for the same people
        if (selectedUsers.some((u) => u._id === userToAdd._id)) {
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
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      {/* the caller decides what the opening button looks like */}
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
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
                Create a group
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" flexDir="column" gap={1}>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input
                  placeholder="Group Name"
                  mb={3}
                  value={groupChatName || ""}
                  onChange={(e) => setGroupChatName(e.target.value)}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Search User</Field.Label>
                <Input
                  placeholder="User name"
                  mb={1}
                  value={search || ""}
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
                <Button variant="ghost" color="gray.300" _hover={{ bg: "rgba(255,255,255,0.08)" }}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>

              <Button
                onClick={handleSubmit}
                bg="var(--accent)"
                color="var(--on-accent)"
                fontWeight="600"
                _hover={{ bg: "var(--accent-strong)" }}
              >
                Create group
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
