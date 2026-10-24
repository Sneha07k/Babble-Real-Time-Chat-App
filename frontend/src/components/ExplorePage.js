import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Box, Button, Input, Spinner, Text } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import { toaster } from "./ui/toaster";
import { formatChatListTime } from "../config/ChatLogics";
import CreateCommunityModal from "./miscellaneous/CreateCommunityModal";

// each room card gets its own cheerful colour, always the same for that room
const CARD_COLORS = [
  "var(--gradient)",
  "linear-gradient(135deg, #f97316, #db2777)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "linear-gradient(135deg, #22c55e, #0ea5e9)",
  "linear-gradient(135deg, #eab308, #f97316)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #14b8a6, #84cc16)",
];
const colorFor = (id = "") =>
  CARD_COLORS[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % CARD_COLORS.length];

const Chip = ({ active, children, ...props }) => (
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
    bg={active ? "white" : "rgba(255,255,255,0.07)"}
    color={active ? "#1a1033" : "gray.200"}
    transition="all 0.15s"
    _hover={active ? {} : { bg: "rgba(255,255,255,0.14)" }}
    {...props}
  >
    {children}
  </Box>
);

const RoomCard = ({ room, onOpen, busy, compact }) => (
  <Box
    className="babble-pop"
    display="flex"
    flexDir="column"
    gap={3}
    p={4}
    minW={compact ? "260px" : undefined}
    bg="rgba(255,255,255,0.04)"
    border="1px solid rgba(255,255,255,0.08)"
    borderRadius="22px"
    transition="transform 0.15s, border-color 0.15s"
    _hover={{ transform: "translateY(-3px)", borderColor: "rgba(255,255,255,0.18)" }}
  >
    <Box display="flex" alignItems="center" gap={3}>
      <Box
        w="52px"
        h="52px"
        flexShrink={0}
        borderRadius="16px"
        bg={colorFor(room._id)}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="26px"
        boxShadow="0 6px 18px rgba(0,0,0,0.3)"
      >
        {room.emoji}
      </Box>
      <Box minW={0} flex="1">
        <Text fontFamily="heading" fontWeight="600" fontSize="lg" truncate>
          {room.chatName}
        </Text>
        <Text fontSize="xs" color="var(--accent-light)" fontWeight="600">
          {room.category}
        </Text>
      </Box>
    </Box>

    <Text fontSize="sm" color="gray.300" lineClamp={2} minH="2.6em">
      {room.description || "A place to hang out"}
    </Text>

    <Box display="flex" alignItems="center" gap={3} fontSize="xs" color="gray.400" flexWrap="wrap">
      <span>
        <i className="fa-solid fa-user-group" /> {room.memberCount}
      </span>
      <Box as="span" color={room.onlineCount ? "var(--online)" : "gray.500"}>
        ● {room.onlineCount} online
      </Box>
      <span>active {formatChatListTime(room.lastActivity) || "—"}</span>
    </Box>

    <Button
      size="sm"
      borderRadius="full"
      fontWeight="700"
      loading={busy}
      onClick={() => onOpen(room)}
      {...(room.joined
        ? { bg: "rgba(255,255,255,0.1)", color: "white", _hover: { bg: "rgba(255,255,255,0.18)" } }
        : { bg: "var(--gradient)", color: "white", _hover: { bg: "var(--gradient-hover)" } })}
    >
      {room.joined ? "Open" : "Join"}
    </Button>
  </Box>
);

const ExplorePage = ({ setView }) => {
  const { user, chats, setChats, setSelectedChat } = ChatState();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [busyId, setBusyId] = useState(null);
  const [rolling, setRolling] = useState(false);

  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  const loadRooms = () =>
    axios
      .get("/api/chat/community", config)
      .then(({ data }) => setRooms(data))
      .catch(() => toaster.create({ description: "Couldn't load communities", type: "error" }))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadRooms();
  }, [user]);

  // put a joined room in the chat list and open it
  const enterRoom = (room) => {
    setChats((prev) => (prev.some((c) => c._id === room._id) ? prev : [room, ...prev]));
    setRooms((prev) =>
      prev.map((r) =>
        r._id === room._id && !r.joined ? { ...r, joined: true, memberCount: r.memberCount + 1 } : r,
      ),
    );
    setSelectedChat(room);
  };

  const openRoom = async (room) => {
    const existing = chats.find((c) => c._id === room._id);
    if (existing) return setSelectedChat(existing);
    try {
      setBusyId(room._id);
      const { data } = await axios.put(`/api/chat/community/${room._id}/join`, {}, config);
      enterRoom(data);
      toaster.create({ description: `Welcome to ${data.emoji || ""} ${data.chatName}!`, type: "success" });
    } catch (error) {
      toaster.create({ description: "Couldn't join the room", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const surpriseMe = async () => {
    try {
      setRolling(true);
      const { data } = await axios.post("/api/chat/community/random", {}, config);
      enterRoom(data);
      toaster.create({ description: `🎲 You landed in ${data.emoji || ""} ${data.chatName}!`, type: "success" });
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || "Couldn't find a room",
        type: "info",
      });
    } finally {
      setRolling(false);
    }
  };

  const categories = useMemo(
    () => ["All", ...new Set(rooms.map((r) => r.category))],
    [rooms],
  );

  const filtered = rooms.filter((r) => {
    if (category !== "All" && r.category !== category) return false;
    const q = query.trim().toLowerCase();
    return !q || `${r.chatName} ${r.description}`.toLowerCase().includes(q);
  });

  // busiest rooms first: people online now, then total members
  const trending = [...rooms]
    .sort((a, b) => b.onlineCount - a.onlineCount || b.memberCount - a.memberCount)
    .slice(0, 4);

  return (
    <Box h="100%" overflowY="auto">
      {/* HERO */}
      <Box
        position="relative"
        overflow="hidden"
        px={{ base: 4, md: 8 }}
        pt={{ base: 4, md: 8 }}
        pb={{ base: 6, md: 8 }}
        bg="linear-gradient(135deg, color-mix(in srgb, var(--c1) 70%, transparent), color-mix(in srgb, var(--c2) 55%, transparent))"
      >
        <Box position="absolute" right="-20px" top="-30px" fontSize="140px" opacity={0.15} pointerEvents="none">
          🌍
        </Box>

        <Box
          as="button"
          type="button"
          display={{ base: "flex", md: "none" }}
          alignItems="center"
          gap={2}
          mb={3}
          color="white"
          fontSize="sm"
          onClick={() => setView("chats")}
        >
          <i className="fa-solid fa-arrow-left" /> Chats
        </Box>

        <Text fontFamily="heading" fontSize={{ base: "2xl", md: "4xl" }} fontWeight="700" lineHeight="1.1">
          Explore communities
        </Text>
        <Text color="whiteAlpha.800" mt={2} maxW="520px">
          Jump into rooms with people from all over the world, or roll the dice and see where you land.
        </Text>

        <Box display="flex" gap={3} mt={5} flexWrap="wrap">
          <Button
            borderRadius="full"
            bg="white"
            color="#1a1033"
            fontWeight="700"
            loading={rolling}
            onClick={surpriseMe}
            _hover={{ transform: "scale(1.04)" }}
            transition="transform 0.15s"
          >
            🎲 Surprise me
          </Button>
          <CreateCommunityModal onCreated={enterRoom}>
            <Button
              borderRadius="full"
              bg="rgba(255,255,255,0.15)"
              color="white"
              fontWeight="700"
              border="1px solid rgba(255,255,255,0.35)"
              _hover={{ bg: "rgba(255,255,255,0.25)" }}
            >
              <i className="fa-solid fa-plus" /> Create community
            </Button>
          </CreateCommunityModal>
        </Box>
      </Box>

      <Box px={{ base: 4, md: 8 }} py={6} display="flex" flexDir="column" gap={6}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <Spinner size="xl" color="var(--accent-light)" />
          </Box>
        ) : (
          <>
            {/* TRENDING */}
            {!query && category === "All" && trending.length > 0 && (
              <Box>
                <Text fontFamily="heading" fontSize="xl" fontWeight="600" mb={3}>
                  🔥 Trending now
                </Text>
                <Box display="flex" gap={4} overflowX="auto" pb={2}>
                  {trending.map((room) => (
                    <RoomCard key={room._id} room={room} onOpen={openRoom} busy={busyId === room._id} compact />
                  ))}
                </Box>
              </Box>
            )}

            {/* SEARCH + CATEGORIES */}
            <Box display="flex" flexDir="column" gap={3}>
              <Text fontFamily="heading" fontSize="xl" fontWeight="600">
                All communities
              </Text>
              <Input
                placeholder="Search communities"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                borderRadius="full"
                bg="rgba(255,255,255,0.06)"
                border="1px solid rgba(255,255,255,0.08)"
                color="white"
                maxW="420px"
                _placeholder={{ color: "gray.500" }}
                _focus={{ borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }}
              />
              <Box display="flex" gap={2} overflowX="auto" pb={1} css={{ scrollbarWidth: "none" }}>
                {categories.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                    {c}
                  </Chip>
                ))}
              </Box>
            </Box>

            {/* GRID */}
            {filtered.length === 0 ? (
              <Text color="gray.400" textAlign="center" py={8}>
                No communities match. Why not create one? ✨
              </Text>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fill, minmax(240px, 1fr))"
                gap={4}
              >
                {filtered.map((room) => (
                  <RoomCard key={room._id} room={room} onOpen={openRoom} busy={busyId === room._id} />
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ExplorePage;
