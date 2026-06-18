import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const ChatContext = createContext();

const ENDPOINT = "http://localhost:5000";

let socket;

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState();

  const [selectedChat, setSelectedChat] = useState();

  const [chats, setChats] = useState([]);

  const [notification, setNotification] = useState([]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    setUser(userInfo);
  }, []);

  useEffect(() => {
    if (!user) return;

    socket = io(ENDPOINT);

    console.log("Socket connecting...");

    socket.emit("setup", user);

    socket.on("connected", () => {
      console.log("Socket connected", socket.id);
    });


    return () => {
      socket.disconnect();
    };
  }, [user]);

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
