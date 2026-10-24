import React, { useEffect, useRef, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, Spinner, Text, Input } from "@chakra-ui/react";
import {
  getSender,
  formatLastSeen,
  messagePreview,
} from "../config/ChatLogics";
import axios from "axios";
import "./styles.css";
import ScorllableChat from "../components/ScorllableChat";
import Lottie from "react-lottie";
import animationData from "../animation/Pudgy work.json";
import EmojiPicker from "emoji-picker-react";
import ProfileModal from "../components/miscellaneous/ProfileModal";
import UpdateGroupChatModal from "../components/miscellaneous/UpdateGroupChatModal";
import CatchUpSidebar from "../components/miscellaneous/CatchUpSidebar";
import ThemePicker from "./miscellaneous/ThemePicker";
import WelcomePanel from "./WelcomePanel";
import { PresenceAvatar } from "./MyChats";
import { Lightbox } from "./MediaMessage";
import VoiceRecorder from "./VoiceRecorder";
import { toaster } from "./ui/toaster";
import { themeOf } from "../config/themes";
import { kindOf, MAX_SIZE, uploadMedia } from "../config/upload";

// rate-limit and "AI not configured" errors carry a readable reason
const showAiError = (error, fallback) =>
  toaster.create({
    description:
      error.response?.data?.message || error.response?.data?.error || fallback,
    type: "error",
  });

// small circular icon button used in the chat header and input bar
const RoundButton = React.forwardRef(({ size = "40px", ...props }, ref) => (
  <Box
    as="button"
    type="button"
    ref={ref}
    w={size}
    h={size}
    flexShrink={0}
    display="flex"
    alignItems="center"
    justifyContent="center"
    borderRadius="full"
    color="gray.200"
    bg="rgba(255,255,255,0.07)"
    cursor="pointer"
    transition="all 0.15s"
    _hover={{ bg: "rgba(255,255,255,0.14)", color: "white", transform: "scale(1.06)" }}
    _disabled={{ cursor: "not-allowed", opacity: 0.5 }}
    {...props}
  />
));

const TYPING_TIMEOUT = 3000;

const SingleChat = ({ fetchAgain, setFetchAgain, setView }) => {
  const {
    user,
    selectedChat,
    setNotification,
    setChats,
    setSelectedChat,
    socket,
    socketConnected,
    onlineUsers,
    lastSeen,
  } = ChatState();

  const selectedChatCompare = useRef();
  // refs, not state: the typing timer must see the latest values
  const typingRef = useRef(false);
  const typingTimerRef = useRef();
  const aiContainerRef = useRef();
  const emojiPickerRef = useRef();
  const emojiButtonRef = useRef();
  const fileInputRef = useRef();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [open, setOpen] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState(null);

  // a photo/video chosen but not sent yet: { file, kind, preview }
  const [pending, setPending] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [recording, setRecording] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${user.token}` } };
  const uploading = uploadProgress !== null;

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  // ---------- loading and reading ----------

  const markRead = (chatId) => {
    axios.put(`/api/messages/${chatId}/read`, {}, authHeaders).catch(() => {});
    setChats((prev) => prev.map((c) => (c._id === chatId ? { ...c, unreadCount: 0 } : c)));
  };

  const fetchMessages = async () => {
    if (!selectedChat?._id) return;

    try {
      setLoading(true);
      const { data } = await axios.get(`/api/messages/${selectedChat._id}`, authHeaders);
      setMessages(data);
      if (data.some((m) => m.sender?._id !== user._id && !m.readBy?.includes(user._id))) {
        markRead(selectedChat._id);
      }
    } catch (err) {
      toaster.create({ description: "Failed to load messages", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // re-join after a reconnect too, since the server forgets rooms on disconnect
  useEffect(() => {
    if (socket && socketConnected && selectedChat?._id) {
      socket.emit("join chat", selectedChat._id);
    }
  }, [selectedChat?._id, socket, socketConnected]);

  useEffect(() => {
    selectedChatCompare.current = selectedChat;
    setIsTyping(false);
    setRecording(false);
    clearPending();
    fetchMessages();
  }, [selectedChat?._id]);

  useEffect(() => {
    if (!socket) return;

    // only show the indicator for the chat that is actually open
    const onTyping = (room, name) => {
      if (room !== selectedChatCompare.current?._id) return;
      setIsTyping(true);
      setTypingName(name || "");
    };
    const onStopTyping = (room) => {
      if (room === selectedChatCompare.current?._id) setIsTyping(false);
    };
    // someone opened the chat: turn our ✓ into ✓✓
    const onRead = ({ chatId, readerId }) => {
      if (chatId !== selectedChatCompare.current?._id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.readBy?.includes(readerId) ? m : { ...m, readBy: [...(m.readBy || []), readerId] },
        ),
      );
    };

    const handleMessageReceived = (incoming) => {
      const isCurrentChatOpen = selectedChatCompare.current?._id === incoming.chat._id;

      if (isCurrentChatOpen) {
        setMessages((prev) => [...prev, incoming]);
        markRead(incoming.chat._id);
      } else {
        setNotification((prev) =>
          prev.some((msg) => msg._id === incoming._id) ? prev : [incoming, ...prev],
        );
      }

      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((chat) => chat._id === incoming.chat._id);

        // someone started a brand-new chat with us: show it at the top
        if (chatIndex === -1) {
          return [{ ...incoming.chat, latestMessage: incoming }, ...prevChats];
        }

        const updatedChat = { ...prevChats[chatIndex], latestMessage: incoming };
        const newChats = [...prevChats];
        newChats.splice(chatIndex, 1);
        newChats.unshift(updatedChat);
        return newChats;
      });
    };

    socket.on("typing", onTyping);
    socket.on("stop typing", onStopTyping);
    socket.on("messages read", onRead);
    socket.on("message received", handleMessageReceived);

    return () => {
      socket.off("typing", onTyping);
      socket.off("stop typing", onStopTyping);
      socket.off("messages read", onRead);
      socket.off("message received", handleMessageReceived);
    };
  }, [socket]);

  // ---------- AI helpers ----------

  useEffect(() => {
    setActiveSuggestion(-1);
  }, [aiSuggestion]);

  const fetchAISuggestions = async () => {
    if (!messages.length) {
      toaster.create({
        description: "Send a message first, then Ask AI for replies",
        type: "info",
      });
      return;
    }

    try {
      setAiLoading(true);
      const context = messages.slice(-6).map(messagePreview).join("\n");
      const res = await axios.post("/api/ai/replies", { message: context }, authHeaders);
      setAiSuggestion(res.data || []);
    } catch (err) {
      showAiError(err, "Couldn't get suggestions");
      setAiSuggestion([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCatchUp = async () => {
    if (loadingSummary) return;
    if (!messages.length) {
      toaster.create({ description: "Nothing to summarize yet", type: "info" });
      return;
    }

    try {
      setLoadingSummary(true);
      const { data } = await axios.post(
        "/api/ai/summarize",
        {
          messages: messages.map((m) => ({
            sender: m.sender?.name || "Unknown",
            content: messagePreview(m),
          })),
        },
        authHeaders,
      );
      setSummary(data);
      setShowSummary(true);
    } catch (error) {
      showAiError(error, "Couldn't summarize this chat");
    } finally {
      setLoadingSummary(false);
    }
  };

  // close the AI and emoji popups when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (aiContainerRef.current && !aiContainerRef.current.contains(e.target)) {
        setAiSuggestion([]);
        setActiveSuggestion(-1);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !emojiButtonRef.current?.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- sending ----------

  const clearPending = () => {
    setPending((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      return null;
    });
  };

  const pickFile = (file) => {
    if (!file) return;
    const kind = kindOf(file);
    if (kind !== "image" && kind !== "video") {
      toaster.create({ description: "You can send photos and videos", type: "warning" });
      return;
    }
    if (file.size > MAX_SIZE[kind]) {
      toaster.create({
        description: `That ${kind} is too big (max ${MAX_SIZE[kind] / 1024 / 1024} MB)`,
        type: "warning",
      });
      return;
    }
    clearPending();
    setPending({ file, kind, preview: URL.createObjectURL(file) });
  };

  const postMessage = async (body) => {
    const { data } = await axios.post(
      "/api/messages",
      { chatId: selectedChat._id, ...body },
      authHeaders,
    );
    // the server delivers the message to the other members after saving it
    setMessages((prev) => [...prev, data]);
    setChats((prevChats) =>
      prevChats.map((chat) => (chat._id === data.chat._id ? { ...chat, latestMessage: data } : chat)),
    );
  };

  // called by the Enter key and by the send button
  const sendMessage = async () => {
    if (uploading || (!newMessage.trim() && !pending)) return;

    clearTimeout(typingTimerRef.current);
    typingRef.current = false;
    socket?.emit("stop typing", selectedChat._id);

    const text = newMessage;
    const toUpload = pending;
    try {
      let attachment;
      if (toUpload) {
        setUploadProgress(0);
        attachment = await uploadMedia(toUpload.file, setUploadProgress);
      }
      await postMessage({ content: text, ...(attachment && { attachment }) });
      setNewMessage("");
      clearPending();
      setAiSuggestion([]);
      setActiveSuggestion(-1);
      setShowEmojiPicker(false);
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || error.message || "Message could not be sent",
        type: "error",
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const sendVoiceNote = async (file, seconds) => {
    setRecording(false);
    try {
      setUploadProgress(0);
      const attachment = await uploadMedia(file, setUploadProgress);
      await postMessage({ attachment: { ...attachment, duration: attachment.duration || seconds } });
    } catch (error) {
      toaster.create({
        description: error.response?.data?.message || error.message || "Voice note could not be sent",
        type: "error",
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (activeSuggestion >= 0 && aiSuggestion.length > 0) {
        setNewMessage(aiSuggestion[activeSuggestion]);
        setAiSuggestion([]);
        setActiveSuggestion(-1);
        return;
      }
      sendMessage();
    }

    if (e.key === "ArrowDown" && aiSuggestion.length) {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev < aiSuggestion.length - 1 ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp" && aiSuggestion.length) {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : aiSuggestion.length - 1));
    }

    if (e.key === "Escape") {
      setAiSuggestion([]);
      setActiveSuggestion(-1);
    }
  };

  // pasting a screenshot attaches it, like most chat apps
  const handlePaste = (e) => {
    const file = [...(e.clipboardData?.files || [])].find((f) => kindOf(f) === "image");
    if (file) {
      e.preventDefault();
      pickFile(file);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    setAiSuggestion([]);
    setActiveSuggestion(-1);

    if (!socketConnected) return;

    const room = selectedChat._id;

    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit("typing", room);
    }

    // restart the countdown on every keystroke; stop after 3s of silence
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      socket.emit("stop typing", room);
    }, TYPING_TIMEOUT);
  };

  // ---------- header details ----------

  const otherUser = selectedChat && !selectedChat.isGroupChat
    ? selectedChat.users.find((u) => u._id !== user._id)
    : null;

  const chatTitle = otherUser
    ? getSender(user, selectedChat.users)
    : selectedChat?.chatName;

  const otherOnline = Boolean(otherUser && (otherUser.isBot || onlineUsers.has(otherUser._id)));
  const humans = selectedChat?.users.filter((u) => !u.isBot) || [];
  const onlineHere = humans.filter((u) => u._id !== user._id && onlineUsers.has(u._id)).length;

  let chatSubtitle;
  if (isTyping) {
    chatSubtitle = selectedChat?.isGroupChat && typingName ? `${typingName} is typing…` : "typing…";
  } else if (otherUser?.isBot) {
    chatSubtitle = "AI assistant · always online";
  } else if (otherUser) {
    chatSubtitle = otherOnline ? "online" : formatLastSeen(lastSeen[otherUser._id] || otherUser.lastSeen);
  } else if (selectedChat?.isCommunity) {
    chatSubtitle = `${humans.length} members · ${selectedChat.category || "Community"}`;
  } else {
    chatSubtitle = `${humans.length} members${onlineHere ? ` · ${onlineHere} online` : ""}`;
  }

  const adminId = selectedChat?.groupAdmin?._id || selectedChat?.groupAdmin;
  const canTheme = !selectedChat?.isCommunity || adminId === user._id;
  const theme = themeOf(selectedChat);
  const showMic = !newMessage.trim() && !pending;

  if (!selectedChat) {
    return (
      <>
        <WelcomePanel setView={setView} />
        <CatchUpSidebar isOpen={showSummary} onClose={() => setShowSummary(false)} summary={summary} />
      </>
    );
  }

  return (
    <>
      {/* HEADER */}
      <Box w="100%" display="flex" alignItems="center" gap={{ base: 2, md: 3 }} pb={3} px={1}>
        <RoundButton
          display={{ base: "flex", md: "none" }}
          onClick={() => setSelectedChat(null)}
          aria-label="Back to chats"
        >
          <i className="fa-solid fa-arrow-left" />
        </RoundButton>

        <Box
          display="flex"
          alignItems="center"
          gap={3}
          flex="1"
          minW={0}
          cursor={otherUser ? "pointer" : "default"}
          onClick={() => otherUser && setOpen(true)}
        >
          {selectedChat.isCommunity ? (
            <Box
              w="44px"
              h="44px"
              flexShrink={0}
              borderRadius="16px"
              bg={theme.swatch}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="22px"
            >
              {selectedChat.emoji || "💬"}
            </Box>
          ) : (
            <PresenceAvatar src={otherUser?.picture} name={chatTitle} online={otherOnline} />
          )}

          <Box minW={0}>
            <Text fontFamily="heading" fontSize="xl" fontWeight="600" color="white" lineHeight="1.15" truncate>
              {chatTitle}
            </Text>
            <Text
              fontSize="xs"
              color={isTyping ? "var(--pink)" : otherOnline ? "var(--online)" : "gray.400"}
              fontStyle={isTyping ? "italic" : "normal"}
              truncate
            >
              {chatSubtitle}
            </Text>
          </Box>
        </Box>

        {canTheme && (
          <ThemePicker
            trigger={
              <RoundButton title="Chat theme" aria-label="Chat theme">
                <i className="fa-solid fa-palette" />
              </RoundButton>
            }
          />
        )}

        <RoundButton
          onClick={handleCatchUp}
          title="Catch up: AI summary of this chat"
          aria-label="Catch up"
          color="var(--accent-light)"
        >
          {loadingSummary ? <Spinner size="sm" /> : <i className="fa-solid fa-newspaper" />}
        </RoundButton>

        {selectedChat.isGroupChat && (
          <UpdateGroupChatModal
            fetchAgain={fetchAgain}
            setFetchAgain={setFetchAgain}
            fetchMessages={fetchMessages}
          />
        )}

        {otherUser && <ProfileModal user={otherUser} open={open} setOpen={setOpen} />}
      </Box>

      {/* MESSAGES on the chat's wallpaper */}
      <Box
        display="flex"
        flexDir="column"
        w="100%"
        flex="1"
        minH={0}
        background={theme.wallpaper}
        borderRadius="20px"
        border="1px solid rgba(255,255,255,0.06)"
        overflow="hidden"
        transition="background 0.4s"
      >
        {loading ? (
          <Box flex="1" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="var(--accent-light)" />
          </Box>
        ) : (
          <Box flex="1" minH={0} overflow="hidden">
            <ScorllableChat
              messages={messages}
              chat={selectedChat}
              mineColor={theme.mine}
              onOpenImage={setLightboxUrl}
            />
          </Box>
        )}

        {isTyping && (
          <Box px={3} pb={1}>
            <Lottie options={defaultOptions} width={48} height={48} />
          </Box>
        )}
      </Box>

      {/* PHOTO/VIDEO waiting to be sent */}
      {pending && (
        <Box
          className="babble-pop"
          mt={3}
          w="100%"
          display="flex"
          alignItems="center"
          gap={3}
          p={2}
          borderRadius="18px"
          bg="rgba(255,255,255,0.06)"
          border="1px solid rgba(255,255,255,0.08)"
        >
          <Box
            as={pending.kind === "image" ? "img" : "video"}
            src={pending.preview}
            w="64px"
            h="64px"
            objectFit="cover"
            borderRadius="12px"
            bg="black"
            flexShrink={0}
          />
          <Box flex="1" minW={0}>
            <Text fontSize="sm" fontWeight="600" truncate>
              {pending.kind === "image" ? "📷 Photo" : "🎥 Video"} · {pending.file.name}
            </Text>
            {uploading ? (
              <Box mt={2} h="6px" borderRadius="full" bg="rgba(255,255,255,0.1)" overflow="hidden">
                <Box h="100%" w={`${uploadProgress}%`} bg="var(--gradient)" transition="width 0.2s" />
              </Box>
            ) : (
              <Text fontSize="xs" color="gray.400">
                {(pending.file.size / 1024 / 1024).toFixed(1)} MB · add a caption below, then send
              </Text>
            )}
          </Box>
          {!uploading && (
            <RoundButton onClick={clearPending} aria-label="Remove attachment" size="34px">
              <i className="fa-solid fa-xmark" />
            </RoundButton>
          )}
        </Box>
      )}

      {/* voice note upload progress */}
      {uploading && !pending && (
        <Box mt={3} w="100%" display="flex" alignItems="center" gap={3} px={2}>
          <Text fontSize="xs" color="gray.400" flexShrink={0}>
            🎤 Sending voice note…
          </Text>
          <Box flex="1" h="6px" borderRadius="full" bg="rgba(255,255,255,0.1)" overflow="hidden">
            <Box h="100%" w={`${uploadProgress}%`} bg="var(--gradient)" transition="width 0.2s" />
          </Box>
        </Box>
      )}

      {/* INPUT BAR */}
      <Box mt={3} w="100%" display="flex" alignItems="center" gap={2} position="relative">
        {(aiSuggestion.length > 0 || aiLoading) && (
          <Box
            ref={aiContainerRef}
            position="absolute"
            bottom="100%"
            left="0"
            right="0"
            mb="8px"
            bg="var(--panel-strong)"
            border="1px solid rgba(255,255,255,0.1)"
            borderRadius="18px"
            p={2}
            zIndex={1000}
            boxShadow="0 10px 30px rgba(0,0,0,0.4)"
          >
            <Text fontSize="xs" color="gray.400" px={2} pb={1}>
              {aiLoading ? "✨ AI is thinking..." : "✨ Suggested replies (↑ ↓ then Enter)"}
            </Text>

            {aiSuggestion.map((r, i) => (
              <Text
                key={i}
                cursor="pointer"
                bg={i === activeSuggestion ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "transparent"}
                px={3}
                py="7px"
                borderRadius="12px"
                color="white"
                fontSize="sm"
                onMouseEnter={() => setActiveSuggestion(i)}
                onClick={() => {
                  setNewMessage(r);
                  setAiSuggestion([]);
                  setActiveSuggestion(-1);
                }}
              >
                {r}
              </Text>
            ))}
          </Box>
        )}

        {showEmojiPicker && (
          <Box ref={emojiPickerRef} position="absolute" bottom="100%" left="0" mb="8px" zIndex={2000}>
            <EmojiPicker
              theme="dark"
              width={320}
              height={380}
              onEmojiClick={(emojiData) => setNewMessage((prev) => prev + emojiData.emoji)}
            />
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            pickFile(e.target.files[0]);
            e.target.value = "";
          }}
        />

        {recording ? (
          <VoiceRecorder onSend={sendVoiceNote} onCancel={() => setRecording(false)} />
        ) : (
          <Box
            flex="1"
            minW={0}
            display="flex"
            alignItems="center"
            gap={1}
            h="50px"
            bg="rgba(255,255,255,0.07)"
            border="1px solid rgba(255,255,255,0.1)"
            borderRadius="full"
            px={1}
            transition="border-color 0.2s"
            _focusWithin={{ borderColor: "var(--accent-light)" }}
          >
            <RoundButton
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              aria-label="Emoji"
              bg="transparent"
            >
              <i className="fa-regular fa-face-smile" />
            </RoundButton>

            <RoundButton
              onClick={() => fileInputRef.current?.click()}
              aria-label="Send a photo or video"
              title="Photo or video"
              bg="transparent"
              disabled={uploading}
            >
              <i className="fa-solid fa-paperclip" />
            </RoundButton>

            <Input
              flex="1"
              minW={0}
              px={1}
              border="none"
              bg="transparent"
              color="white"
              placeholder={pending ? "Add a caption…" : "Type a message"}
              _placeholder={{ color: "gray.500" }}
              _focus={{ boxShadow: "none", outline: "none" }}
              value={newMessage}
              onChange={typingHandler}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            />

            <Box
              as="button"
              type="button"
              onClick={fetchAISuggestions}
              title="Ask AI for reply ideas"
              display="flex"
              alignItems="center"
              gap={2}
              flexShrink={0}
              h="38px"
              px={3}
              borderRadius="full"
              color="white"
              bg="color-mix(in srgb, var(--accent) 35%, transparent)"
              fontSize="sm"
              fontWeight="600"
              cursor="pointer"
              transition="background 0.2s"
              _hover={{ bg: "color-mix(in srgb, var(--accent) 55%, transparent)" }}
            >
              <i className="fa-solid fa-wand-magic-sparkles" />
              <Text as="span" display={{ base: "none", md: "inline" }}>
                Ask AI
              </Text>
            </Box>
          </Box>
        )}

        {!recording &&
          (showMic ? (
            <RoundButton
              onClick={() => setRecording(true)}
              aria-label="Record a voice note"
              title="Voice note"
              size="50px"
              bg="var(--gradient)"
              color="white"
              disabled={uploading}
              _hover={{ bg: "var(--gradient-hover)", transform: "scale(1.06)" }}
            >
              <i className="fa-solid fa-microphone" />
            </RoundButton>
          ) : (
            <RoundButton
              onClick={sendMessage}
              aria-label="Send message"
              size="50px"
              bg="var(--gradient)"
              color="white"
              disabled={uploading}
              _hover={{ bg: "var(--gradient-hover)", transform: "scale(1.06)" }}
            >
              {uploading ? <Spinner size="sm" /> : <i className="fa-solid fa-paper-plane" />}
            </RoundButton>
          ))}
      </Box>

      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      <CatchUpSidebar isOpen={showSummary} onClose={() => setShowSummary(false)} summary={summary} />
    </>
  );
};

export default SingleChat;
