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

const menuStyle = {
  bg: "var(--panel-strong)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
  minW: "240px",
  p: 1,
};

const menuItemStyle = {
  borderRadius: "10px",
  color: "gray.100",
  gap: 3,
  py: 2,
  cursor: "pointer",
  _highlighted: { bg: "color-mix(in srgb, var(--accent) 18%, transparent)" },
};

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
    logout,
  } = ChatState();

  const history = useHistory();

  const logoutHandler = () => {
    logout();
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

      const { data } = await axios.get(
        `/api/user?search=${encodeURIComponent(search)}`,
        config,
      );

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
      bg="var(--topbar)"
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
              bg: "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent-light)",
            }}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
            <Text as="span" display={{ base: "none", md: "inline" }}>
              Search User
            </Text>
          </Button>
        </Drawer.Trigger>

        <Portal>
          <Drawer.Backdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />

          <Drawer.Positioner>
            <Drawer.Content
              bg="var(--panel-strong)"
              color="white"
              borderLeft="1px solid"
              borderColor="color-mix(in srgb, var(--accent) 15%, transparent)"
              backdropFilter="blur(20px)"
              boxShadow="-10px 0 30px rgba(0,0,0,0.4)"
            >
              <Drawer.Header />

              {loadingChat && (
                <Box display="flex" justifyContent="center" py={3}>
                  <Spinner size="xl" color="var(--accent-light)" borderWidth="4px" />
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
                        borderColor: "var(--accent-light)",
                        boxShadow: "0 0 0 1px var(--accent)",
                      }}
                    />
                    <Button
                      bg="var(--accent)"
                      color="black"
                      fontWeight="600"
                      minW="70px"
                      _hover={{
                        bg: "var(--accent-light)",
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
                  bg="#EF4444"
                  color="white"
                  borderRadius="full"
                  fontSize="10px"
                  minW="18px"
                  justifyContent="center"
                >
                  {notification.length}
                </Badge>
              )}
            </Button>
          </Menu.Trigger>

          <Portal>
            <Menu.Positioner>
              <Menu.Content {...menuStyle}>
                <Text px={3} pt={2} pb={1} fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="0.5px">
                  Notifications
                </Text>
                {Object.values(groupedNotifications).length === 0 && (
                  <Menu.Item value="none" color="gray.400" {...menuItemStyle}>
                    <i className="fa-regular fa-bell-slash" /> You're all caught up
                  </Menu.Item>
                )}

                {Object.values(groupedNotifications).map((group) => (
                  <Menu.Item
                    key={group.chat._id}
                    value={group.chat._id}
                    {...menuItemStyle}
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
              <Menu.Content {...menuStyle}>
                <Box px={3} pt={2} pb={2}>
                  <Text fontWeight="700" color="white" truncate>
                    {user.name}
                  </Text>
                  <Text fontSize="xs" color="gray.400" truncate>
                    {user.email}
                  </Text>
                </Box>
                <Menu.Separator borderColor="rgba(255,255,255,0.08)" />
                <Menu.Item value="profile" onClick={() => setProfileOpen(true)} {...menuItemStyle}>
                  <i className="fa-regular fa-user" /> My profile
                </Menu.Item>

                <Menu.Item
                  value="logout"
                  onClick={logoutHandler}
                  {...menuItemStyle}
                  color="#FCA5A5"
                  _highlighted={{ bg: "rgba(239,68,68,0.15)" }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket" /> Log out
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
