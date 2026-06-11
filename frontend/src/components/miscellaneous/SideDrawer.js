import { Tooltip } from "../ui/tooltip";
import React from "react";
import { useState } from "react";
import ChatLoading from "../ChatLoading";
import axios from "axios";
import UserListItem from "../UserAvatar/UserListItem";
// import { Spinner } from "@chakra-ui/react";

import {
  Avatar,
  Button,
  Menu,
  CloseButton,
  Drawer,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { Text } from "@chakra-ui/react";
import babbleLogo from "C:/Users/sneha/OneDrive/Desktop/projects/OGC/frontend/src/babble_logo.svg";
import { Portal } from "@chakra-ui/react";
import { BiBell } from "react-icons/bi";
import { GrPocket } from "react-icons/gr";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import { useHistory } from "react-router-dom";
import { toaster } from "../ui/toaster";

// import { Avatar } from "@chakra-ui/react";

// import { BellIcon } from "@chakra-ui/icons";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, setSelectedChat, chats, setChats } = ChatState();
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

  return (
    <>
      <Box
        width="100vw"
        backgroundColor="gray.800"
        height="9vh"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        p="5px 10px 5px 10px"
      >
        <Drawer.Root placement="start" size="sm">
          <Drawer.Trigger asChild>
            <Button variant="outline" size="sm">
              <i className="fa-solid fa-magnifying-glass"></i>Search User
            </Button>
          </Drawer.Trigger>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content>
                <Drawer.Header>
                  {/* <Drawer.Title>Drawer Title</Drawer.Title> */}
                </Drawer.Header>
                {loadingChat && <Spinner ml="auto" display="flex" />}
                <Drawer.Body>
                  <Box
                    // display="flex"
                    pb={2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box mb={5}>
                      <Input
                        placeholder="Search User by name or email"
                        mr={2}
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                        }}
                        width="9/12"
                      />
                      <Button onClick={handleSearch}>Go</Button>
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
                <Drawer.Footer></Drawer.Footer>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>

        <Box d="flex" alignItems="center" p="10px 0px 0px 0px">
          <img src={babbleLogo} alt="Babble Logo" p={0} width="230px" />
        </Box>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="outline" size="sm" border="none">
                <i class="fa-solid fa-bell" style={{ fontSize: "20px" }}></i>
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="new-txt">New Text File</Menu.Item>
                  <Menu.Item value="new-file">New File...</Menu.Item>
                  <Menu.Item value="new-win">New Window</Menu.Item>
                  <Menu.Item value="open-file">Open File...</Menu.Item>
                  <Menu.Item value="export">Export</Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button
                variant="outline"
                size="sm"
                border="none"
                backgroundColor={"green"}
                width="70px"
                height="40px"
              >
                <Avatar.Root size="sm" bg={"black"}>
                  <Avatar.Image src={user.picture} />
                  <Avatar.Fallback name={user.name} />
                </Avatar.Root>
                <GrPocket />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value="profile"
                    onClick={() => setProfileOpen(true)}
                  >
                    My Profile
                  </Menu.Item>
                  <Menu.Item value="logout" onClick={logoutHandler}>
                    Logout
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <ProfileModal
            user={user}
            open={profileOpen}
            setOpen={setProfileOpen}
          />
        </div>
      </Box>
    </>
  );
};

export default SideDrawer;
