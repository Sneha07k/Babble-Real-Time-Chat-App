import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

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

  useEffect(() => {
    if (!user) return;

    const newSocket = io(ENDPOINT, { auth: { token: user.token } });

    newSocket.on("connected", () => setSocketConnected(true));
    newSocket.on("disconnect", () => setSocketConnected(false));
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
