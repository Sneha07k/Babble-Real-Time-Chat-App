import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { toaster } from "../components/ui/toaster";
import { THEMES } from "../config/themes";

const ChatContext = createContext();

// same origin in both development (Vite proxies /socket.io) and production;
// set VITE_SOCKET_URL only if the backend lives on a different domain
const ENDPOINT = import.meta.env.VITE_SOCKET_URL || undefined;

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo"));
  } catch (error) {
    return null;
  }
};

const ChatProvider = ({ children }) => {
  // read synchronously so pages know on the first render whether someone is logged in
  const [user, setUser] = useState(readStoredUser);

  const [selectedChat, setSelectedChat] = useState();

  const [chats, setChats] = useState([]);

  const [notification, setNotification] = useState([]);

  const [socket, setSocket] = useState(null);

  const [socketConnected, setSocketConnected] = useState(false);

  // ids of contacts who have Babble open right now
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());

  // fresher "last seen" times than the ones loaded with the chat list
  const [lastSeen, setLastSeen] = useState({});

  useEffect(() => {
    if (!user) return;

    const newSocket = io(ENDPOINT, { auth: { token: user.token } });

    newSocket.on("connected", () => setSocketConnected(true));
    newSocket.on("disconnect", () => setSocketConnected(false));

    newSocket.on("online users", (ids) => setOnlineUsers(new Set(ids)));
    newSocket.on("presence", ({ userId, online, lastSeen: seen }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
      if (seen) setLastSeen((prev) => ({ ...prev, [userId]: seen }));
    });

    // someone else in the chat picked a new theme
    newSocket.on("chat theme", ({ chatId, theme, by }) => {
      setChats((prev) => prev.map((c) => (c._id === chatId ? { ...c, theme } : c)));
      setSelectedChat((prev) => (prev?._id === chatId ? { ...prev, theme } : prev));
      toaster.create({
        description: `${by} changed the chat theme to ${THEMES[theme]?.name || theme}`,
        type: "info",
      });
    });
    // the server refuses the socket when the saved login is no longer valid
    newSocket.on("connect_error", (error) => {
      if (error.message === "Not authorized") logout();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setSocketConnected(false);
    };
  }, [user]);

  function logout() {
    localStorage.removeItem("userInfo");
    setUser(null);
    setSelectedChat(null);
    setChats([]);
    setNotification([]);
    setOnlineUsers(new Set());
  }

  // an expired or revoked login: sign out instead of failing silently
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const sentToken = error.config?.headers?.Authorization;
        if (error.response?.status === 401 && sentToken) logout();
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,

        selectedChat,
        setSelectedChat,

        chats,
        setChats,

        notification,
        setNotification,

        socket,
        socketConnected,

        onlineUsers,
        lastSeen,

        logout,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
