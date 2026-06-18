import { Tooltip } from "../ui/tooltip";
import React, { useState } from "react";
import ChatLoading from "../ChatLoading";
import axios from "axios";
import UserListItem from "../UserAvatar/UserListItem";
import { Badge } from "@chakra-ui/react";

import {
  Avatar,
  Button,
  Menu,
  CloseButton,
  Drawer,
  Input,
  Spinner,
  Box,
  Text,
} from "@chakra-ui/react";

import babbleLogo from "../../babble_logo.svg";

import { Portal } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import { useHistory } from "react-router-dom";
import { toaster } from "../ui/toaster";
import { getSender } from "../../config/ChatLogics";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = ChatState();

  const history = useHistory();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    history.push("/");
  };

  const handleSearch = async () => {
    if (!search) {
      toaster.create({
        title: "Input Required",
        description: "Please enter something to search",
        type: "info",
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

      const { data } = await axios.get(`/api/user?search=${search}`, config);

      setSearchResult(data);
    } catch (error) {
      toaster.create({
        title: "Search Failed",
        description: error.response?.data?.message || "Failed to search users",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post("/api/chat", { userId }, config);

      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);

      setLoadingChat(false);
    } catch (error) {
      setLoadingChat(false);

      toaster.create({
        title: "Error fetching chat",
        description: "Failed to fetch the chat",
        type: "error",
      });
    }
  };

  const groupedNotifications = notification.reduce((acc, notif) => {
    const key = notif.chat._id;

    if (!acc[key]) {
      acc[key] = {
        chat: notif.chat,
        messages: [],
      };
    }

    acc[key].messages.push(notif);

    return acc;
  }, {});

  return (
    <Box
      width="100%"
      height="70px"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      px={5}
      bg="rgba(15,18,26,0.85)"
      backdropFilter="blur(14px)"
      borderBottom="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      boxShadow="0 8px 25px rgba(0,0,0,0.25)"
    >
      {/* SEARCH */}

      <Drawer.Root placement="start" size="sm">
        <Drawer.Trigger asChild>
          <Button
            size="sm"
            borderRadius="lg"
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.12)"
            color="gray.200"
            _hover={{
              bg: "rgba(34,211,238,0.15)",
              color: "#22D3EE",
            }}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
            Search User
          </Button>
        </Drawer.Trigger>

        <Portal>
          <Drawer.Backdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />

          <Drawer.Positioner>
            <Drawer.Content
              bg="rgba(8,12,28,0.98)"
              color="white"
              borderLeft="1px solid"
              borderColor="rgba(34,211,238,0.15)"
              backdropFilter="blur(20px)"
              boxShadow="-10px 0 30px rgba(0,0,0,0.4)"
            >
              <Drawer.Header />

              {loadingChat && (
                <Box display="flex" justifyContent="center" py={3}>
                  <Spinner size="xl" color="#22D3EE" borderWidth="4px" />
                </Box>
              )}

              <Drawer.Body>
                <Box pb={2}>
                  <Box mb={5} display="flex" gap={2}>
                    <Input
                      placeholder="Search users by name or email"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      bg="rgba(255,255,255,0.05)"
                      border="1px solid"
                      borderColor="rgba(255,255,255,0.08)"
                      color="white"
                      _placeholder={{
                        color: "gray.500",
                      }}
                      _focus={{
                        borderColor: "#22D3EE",
                        boxShadow: "0 0 0 1px #22D3EE",
                      }}
                    />
                    <Button
                      bg="#22D3EE"
                      color="black"
                      fontWeight="600"
                      minW="70px"
                      _hover={{
                        bg: "#67E8F9",
                      }}
                      onClick={handleSearch}
                    >
                      Go
                    </Button>
                  </Box>

                  {loading ? (
                    <ChatLoading />
                  ) : (
                    searchResult?.map((user) => (
                      <UserListItem
                        key={user._id}
                        user={user}
                        handleFunction={() => accessChat(user._id)}
                      />
                    ))
                  )}
                </Box>
              </Drawer.Body>

              <Drawer.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="gray.300"
                  _hover={{
                    bg: "rgba(255,255,255,0.08)",
                  }}
                />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      {/* LOGO */}

      <Box display="flex" alignItems="center">
        <img src={babbleLogo} alt="Babble Logo" width="180px" />
      </Box>

      <Box display="flex" gap={4} alignItems="center">
        {/* NOTIFICATIONS */}

        <Menu.Root>
          <Menu.Trigger asChild>
            <Button
              size="sm"
              border="none"
              bg="transparent"
              position="relative"
              _hover={{
                bg: "rgba(255,255,255,0.08)",
              }}
            >
              <i
                className="fa-solid fa-bell"
                style={{
                  fontSize: "22px",
                  color: "white",
                }}
              />

              {notification.length > 0 && (
                <Badge
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  bg="red"
                  color="white"
                  borderRadius="full"
                >
                  {notification.length}
                </Badge>
              )}
            </Button>
          </Menu.Trigger>

          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                {Object.values(groupedNotifications).length === 0 && (
                  <Menu.Item value="none">No new messages</Menu.Item>
                )}

                {Object.values(groupedNotifications).map((group) => (
                  <Menu.Item
                    key={group.chat._id}
                    value={group.chat._id}
                    onClick={() => {
                      setSelectedChat(group.chat);

                      setNotification(
                        notification.filter(
                          (n) => n.chat._id !== group.chat._id,
                        ),
                      );
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={3}
                      width="100%"
                    >
                      {!group.chat.isGroupChat && (
                        <Avatar.Root size="sm">
                          <Avatar.Image
                            src={
                              group.messages[0].sender._id === user._id
                                ? group.chat.users.find(
                                    (u) => u._id !== user._id,
                                  )?.picture
                                : group.messages[0].sender.picture
                            }
                          />
                          <Avatar.Fallback />
                        </Avatar.Root>
                      )}

                      <Box>
                        <Text fontWeight="bold">
                          {group.chat.isGroupChat
                            ? group.chat.chatName
                            : getSender(user, group.chat.users)}
                        </Text>

                        <Text fontSize="xs" color="gray.400">
                          {group.messages.length} unread message
                          {group.messages.length > 1 ? "s" : ""}
                        </Text>
                      </Box>
                    </Box>
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        {/* PROFILE AVATAR ONLY */}

        <Menu.Root>
          <Menu.Trigger asChild>
            <Box
              cursor="pointer"
              borderRadius="full"
              transition="0.2s"
              _hover={{
                transform: "scale(1.08)",
              }}
            >
              <Avatar.Root size="md">
                <Avatar.Image src={user.picture} />

                <Avatar.Fallback name={user.name} />
              </Avatar.Root>
            </Box>
          </Menu.Trigger>

          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="profile" onClick={() => setProfileOpen(true)}>
                  My Profile
                </Menu.Item>

                <Menu.Item value="logout" onClick={logoutHandler}>
                  Logout
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        <ProfileModal user={user} open={profileOpen} setOpen={setProfileOpen} />
      </Box>
    </Box>
  );
};

export default SideDrawer;
