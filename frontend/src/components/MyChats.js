import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Avatar, Box, Input, Spinner, Stack, Text } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import { toaster } from "./ui/toaster";
import {
  getSender,
  formatChatListTime,
  messagePreview,
} from "../config/ChatLogics";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import SideDrawer from "./miscellaneous/SideDrawer";
import WelcomePanel from "./WelcomePanel";
import BabbleLogo from "./BabbleLogo";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "groups", label: "Groups" },
  { key: "rooms", label: "Rooms" },
];

const ChatTag = ({ children }) => (
  <Text
    as="span"
    ml={2}
    px={2}
    py="1px"
    borderRadius="full"
    fontSize="10px"
    fontWeight="700"
    letterSpacing="0.5px"
    textTransform="uppercase"
    bg="color-mix(in srgb, var(--accent) 25%, transparent)"
    color="var(--accent-light)"
    verticalAlign="middle"
  >
    {children}
  </Text>
);

const Pill = ({ active, children, ...props }) => (
  <Box
    as="button"
    type="button"
    px={3}
    py="6px"
    borderRadius="full"
    fontSize="sm"
    fontWeight="600"
    whiteSpace="nowrap"
    cursor="pointer"
    transition="all 0.15s"
    bg={active ? "var(--gradient)" : "rgba(255,255,255,0.06)"}
    color={active ? "white" : "gray.300"}
    _hover={active ? {} : { bg: "rgba(255,255,255,0.12)", color: "white" }}
    {...props}
  >
    {children}
  </Box>
);

// round avatar with a green dot when the person is online
export const PresenceAvatar = ({ src, name, online, size = "md" }) => (
  <Box position="relative" flexShrink={0}>
    <Avatar.Root size={size}>
      <Avatar.Image src={src} />
      <Avatar.Fallback name={name} />
    </Avatar.Root>
    {online && (
      <Box
        position="absolute"
        bottom="1px"
        right="1px"
        w="12px"
        h="12px"
        borderRadius="full"
        bg="var(--online)"
        border="2px solid var(--panel-strong)"
      />
    )}
  </Box>
);

const MyChats = ({ fetchAgain, view, setView, hiddenOnMobile }) => {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  // phones only: the welcome/invite panel lives inside the sidebar there
  const [showWelcome, setShowWelcome] = useState(false);

  const {
    selectedChat,
    setSelectedChat,
    user,
    chats,
    setChats,
    socket,
    notification,
    setNotification,
    onlineUsers,
  } = ChatState();

  const authConfig = { headers: { Authorization: `Bearer ${user.token}` } };

  const otherUser = (chat) =>
    chat.isGroupChat ? null : chat.users.find((u) => u._id !== user._id);

  const isOnline = (chat) => {
    const other = otherUser(chat);
    return Boolean(other && (other.isBot || onlineUsers.has(other._id)));
  };

  // unread = saved count from the server + anything that arrived since
  const unreadCount = (chat) =>
    (chat.unreadCount || 0) +
    notification.filter((n) => n.chat._id === chat._id).length;

  const lastMessagePreview = (chat) => {
    const last = chat.latestMessage;
    if (!last) return chat.isCommunity ? chat.description || "Say hi 👋" : "No messages yet";
    const senderId = last.sender?._id || last.sender;
    const text = messagePreview(last);
    if (senderId === user._id) return `You: ${text}`;
    if (chat.isGroupChat && last.sender?.name) {
      return `${last.sender.name.split(" ")[0]}: ${text}`;
    }
    return text;
  };

  const botChat = chats.find((c) => !c.isGroupChat && c.users.some((u) => u.isBot));

  const chatName = (chat) =>
    chat.isGroupChat ? chat.chatName : getSender(user, chat.users);

  const openChat = (chat) => {
    setSelectedChat(chat);
    setNotification((prev) => prev.filter((n) => n.chat._id !== chat._id));
    setChats((prev) => prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c)));
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/chat", authConfig);
      setChats(data);
    } catch (error) {
      toaster.create({
        title: "Error Occurred",
        type: "error",
        description: "Failed to load the chats",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchChats();
  }, [user, fetchAgain]);

  useEffect(() => {
    setShowWelcome(false);
  }, [selectedChat, view]);

  // a friend signed up with our invite link: their chat appears right away
  useEffect(() => {
    if (!socket) return;

    const onNewChat = (chat) => {
      setChats((prev) =>
        prev.some((c) => c._id === chat._id) ? prev : [chat, ...prev],
      );
      const friend = chat.users.find((u) => u._id !== user._id);
      toaster.create({
        description: `${friend?.name || "Someone"} joined from your invite 🎉`,
        type: "success",
      });
    };

    socket.on("new chat", onNewChat);
    return () => socket.off("new chat", onNewChat);
  }, [socket, user, setChats]);

  // typing in the search box also looks for new people (after a short pause)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPeople([]);
      return;
    }
    setPeopleLoading(true);
    const timer = setTimeout(() => {
      axios
        .get(`/api/user?search=${encodeURIComponent(q)}`, authConfig)
        .then(({ data }) => setPeople(data))
        .catch(() => setPeople([]))
        .finally(() => setPeopleLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const startChatWith = async (person) => {
    try {
      const { data } = await axios.post("/api/chat", { userId: person._id }, authConfig);
      setChats((prev) => (prev.some((c) => c._id === data._id) ? prev : [data, ...prev]));
      setQuery("");
      setView("chats");
      openChat(data);
    } catch (error) {
      toaster.create({ description: "Couldn't open that chat", type: "error" });
    }
  };

  const visibleChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chats.filter((chat) => {
      if (q && !chatName(chat).toLowerCase().includes(q)) return false;
      if (filter === "unread") return unreadCount(chat) > 0;
      if (filter === "groups") return chat.isGroupChat && !chat.isCommunity;
      if (filter === "rooms") return chat.isCommunity;
      return true;
    });
  }, [chats, query, filter, notification]);

  // people from search who aren't already one of your 1:1 chats
  const newPeople = people.filter(
    (p) => !chats.some((c) => !c.isGroupChat && c.users.some((u) => u._id === p._id)),
  );

  return (
    <Box
      display={{ base: hiddenOnMobile ? "none" : "flex", md: "flex" }}
      flexDir="column"
      gap={3}
      p={{ base: 3, md: 4 }}
      bg="var(--panel)"
      backdropFilter="blur(14px)"
      h="100%"
      w={{ base: "100%", md: "360px", lg: "390px" }}
      flexShrink={0}
      borderRadius={{ base: 0, md: "24px" }}
      border={{ base: "none", md: "1px solid rgba(255,255,255,0.07)" }}
      boxShadow="0 12px 40px rgba(0,0,0,0.35)"
      color="white"
    >
      {/* HEADER */}
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <BabbleLogo size={32} />
        <Box display="flex" gap={2} alignItems="center">
          <Box
            as="button"
            type="button"
            display={{ base: "flex", md: "none" }}
            w="40px"
            h="40px"
            alignItems="center"
            justifyContent="center"
            borderRadius="full"
            bg={showWelcome ? "var(--gradient)" : "rgba(255,255,255,0.06)"}
            color="white"
            onClick={() => setShowWelcome((prev) => !prev)}
            aria-label="Get started"
          >
            <i className="fa-solid fa-user-plus" />
          </Box>
          {botChat && (
            <Box
              as="button"
              type="button"
              onClick={() => {
                setView("chats");
                openChat(botChat);
              }}
              title="Talk to Babble AI"
              aria-label="Talk to Babble AI"
              position="relative"
              w="40px"
              h="40px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              bg="var(--gradient)"
              color="white"
              fontSize="18px"
              cursor="pointer"
              boxShadow="0 4px 14px color-mix(in srgb, var(--c2) 45%, transparent)"
              transition="transform 0.15s"
              _hover={{ transform: "scale(1.1) rotate(-8deg)" }}
            >
              <i className="fa-solid fa-robot" />
              {unreadCount(botChat) > 0 && (
                <Box
                  className="babble-pop"
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  w="12px"
                  h="12px"
                  borderRadius="full"
                  bg="var(--online)"
                  border="2px solid var(--panel-strong)"
                />
              )}
            </Box>
          )}
          <SideDrawer />
        </Box>
      </Box>

      {/* CHATS / EXPLORE */}
      <Box display="flex" gap={2} bg="rgba(0,0,0,0.25)" p="4px" borderRadius="full">
        <Pill
          flex="1"
          active={view === "chats"}
          onClick={() => setView("chats")}
        >
          💬 Chats
        </Pill>
        <Pill
          flex="1"
          active={view === "explore"}
          onClick={() => {
            setSelectedChat(null);
            setView("explore");
          }}
        >
          🌍 Explore
        </Pill>
      </Box>

      {/* SEARCH */}
      <Box position="relative">
        <Box
          position="absolute"
          left="14px"
          top="50%"
          transform="translateY(-50%)"
          color="gray.500"
          zIndex={1}
          pointerEvents="none"
        >
          <i className="fa-solid fa-magnifying-glass" />
        </Box>
        <Input
          placeholder="Search chats or find people"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          pl="40px"
          borderRadius="full"
          bg="rgba(255,255,255,0.06)"
          border="1px solid rgba(255,255,255,0.08)"
          color="white"
          _placeholder={{ color: "gray.500" }}
          _focus={{ borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }}
        />
      </Box>

      {/* FILTERS + NEW GROUP */}
      <Box display="flex" alignItems="center" gap={2}>
        <Box display="flex" gap={2} overflowX="auto" flex="1" css={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <Pill key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)} fontSize="xs">
              {f.label}
            </Pill>
          ))}
        </Box>
        <GroupChatModal>
          <Box
            as="button"
            type="button"
            title="New group"
            aria-label="New group"
            w="34px"
            h="34px"
            flexShrink={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="full"
            bg="var(--gradient)"
            color="white"
            cursor="pointer"
            transition="transform 0.15s"
            _hover={{ transform: "scale(1.1) rotate(90deg)" }}
          >
            <i className="fa-solid fa-plus" />
          </Box>
        </GroupChatModal>
      </Box>

      {/* LIST */}
      <Box flex="1" minH={0} overflowY="auto" mx={-1} px={1}>
        {showWelcome ? (
          <WelcomePanel setView={setView} />
        ) : loading ? (
          <Box display="flex" justifyContent="center" pt={10}>
            <Spinner size="lg" color="var(--accent-light)" />
          </Box>
        ) : (
          <Stack gap={1}>
            {visibleChats.length === 0 && !query && (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={8}>
                {filter === "unread" ? "No unread chats 🎉" : "Nothing here yet"}
              </Text>
            )}

            {visibleChats.map((chat) => {
              const active = selectedChat?._id === chat._id;
              const unread = unreadCount(chat);
              const other = otherUser(chat);
              return (
                <Box
                  key={chat._id}
                  onClick={() => {
                    setView("chats");
                    openChat(chat);
                  }}
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  gap={3}
                  px={3}
                  py="10px"
                  borderRadius="18px"
                  bg={active ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "transparent"}
                  _hover={{ bg: active ? undefined : "rgba(255,255,255,0.05)" }}
                  transition="background 0.15s"
                >
                  {chat.isCommunity ? (
                    <Box
                      w="40px"
                      h="40px"
                      flexShrink={0}
                      borderRadius="14px"
                      bg="rgba(255,255,255,0.08)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="20px"
                    >
                      {chat.emoji || "💬"}
                    </Box>
                  ) : (
                    <PresenceAvatar
                      src={other?.picture}
                      name={chatName(chat)}
                      online={isOnline(chat)}
                    />
                  )}

                  <Box flex="1" minW={0}>
                    <Box display="flex" alignItems="baseline" gap={2}>
                      <Text fontWeight="600" flex="1" minW={0} truncate>
                        {chatName(chat)}
                        {other?.isBot && <ChatTag>AI</ChatTag>}
                      </Text>
                      <Text fontSize="xs" flexShrink={0} color={unread ? "var(--pink)" : "gray.500"}>
                        {formatChatListTime(chat.latestMessage?.createdAt)}
                      </Text>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Text
                        fontSize="sm"
                        color={unread ? "gray.200" : "gray.400"}
                        fontWeight={unread ? "500" : "400"}
                        flex="1"
                        minW={0}
                        truncate
                      >
                        {lastMessagePreview(chat)}
                      </Text>
                      {unread > 0 && (
                        <Text
                          as="span"
                          className="babble-pop"
                          flexShrink={0}
                          minW="20px"
                          h="20px"
                          px="6px"
                          borderRadius="full"
                          bg="var(--gradient)"
                          color="white"
                          fontSize="11px"
                          fontWeight="700"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {unread}
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {/* PEOPLE from the search box */}
            {query.trim() && (
              <Box pt={2}>
                <Text px={3} pb={1} fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                  People {peopleLoading && <Spinner size="xs" ml={1} />}
                </Text>
                {!peopleLoading && newPeople.length === 0 && (
                  <Text px={3} fontSize="sm" color="gray.500">
                    No new people found
                  </Text>
                )}
                {newPeople.map((person) => (
                  <Box
                    key={person._id}
                    onClick={() => startChatWith(person)}
                    cursor="pointer"
                    display="flex"
                    alignItems="center"
                    gap={3}
                    px={3}
                    py="10px"
                    borderRadius="18px"
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                  >
                    <PresenceAvatar src={person.picture} name={person.name} online={false} />
                    <Box flex="1" minW={0}>
                      <Text fontWeight="600" truncate>
                        {person.name}
                      </Text>
                      <Text fontSize="xs" color="gray.400" truncate>
                        {person.email}
                      </Text>
                    </Box>
                    <Text fontSize="xs" color="var(--accent-light)" fontWeight="700">
                      Say hi 👋
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
