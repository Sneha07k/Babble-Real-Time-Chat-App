import React, { useState } from "react";
import { Avatar, Badge, Box, Menu, Portal, Text } from "@chakra-ui/react";
import { useHistory } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import { getSender, messagePreview } from "../../config/ChatLogics";

const menuStyle = {
  bg: "var(--panel-strong)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
  minW: "260px",
  p: 1,
};

const menuItemStyle = {
  borderRadius: "12px",
  color: "gray.100",
  gap: 3,
  py: 2,
  cursor: "pointer",
  _highlighted: { bg: "color-mix(in srgb, var(--accent) 22%, transparent)" },
};

const iconButton = {
  as: "button",
  type: "button",
  w: "40px",
  h: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "full",
  bg: "rgba(255,255,255,0.06)",
  color: "gray.200",
  cursor: "pointer",
  position: "relative",
  transition: "all 0.15s",
  _hover: { bg: "rgba(255,255,255,0.12)", color: "white", transform: "scale(1.06)" },
};

// the bell and avatar menus at the top of the sidebar
const SideDrawer = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, setSelectedChat, notification, setNotification, logout } = ChatState();
  const history = useHistory();

  const logoutHandler = () => {
    logout();
    history.push("/");
  };

  const groupedNotifications = Object.values(
    notification.reduce((acc, notif) => {
      const key = notif.chat._id;
      acc[key] = acc[key] || { chat: notif.chat, messages: [] };
      acc[key].messages.push(notif);
      return acc;
    }, {}),
  );

  return (
    <Box display="flex" gap={2} alignItems="center">
      {/* NOTIFICATIONS */}
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box {...iconButton} aria-label="Notifications">
            <i className="fa-solid fa-bell" />
            {notification.length > 0 && (
              <Badge
                className="babble-pop"
                position="absolute"
                top="-4px"
                right="-4px"
                bg="var(--pink)"
                color="white"
                borderRadius="full"
                fontSize="10px"
                minW="18px"
                justifyContent="center"
              >
                {notification.length}
              </Badge>
            )}
          </Box>
        </Menu.Trigger>

        <Portal>
          <Menu.Positioner>
            <Menu.Content {...menuStyle}>
              <Text
                px={3}
                pt={2}
                pb={1}
                fontSize="xs"
                fontWeight="700"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Notifications
              </Text>
              {groupedNotifications.length === 0 && (
                <Menu.Item value="none" color="gray.400" {...menuItemStyle}>
                  <i className="fa-regular fa-bell-slash" /> You're all caught up ✨
                </Menu.Item>
              )}

              {groupedNotifications.map((group) => {
                const last = group.messages[0];
                return (
                  <Menu.Item
                    key={group.chat._id}
                    value={group.chat._id}
                    {...menuItemStyle}
                    onClick={() => {
                      setSelectedChat(group.chat);
                      setNotification((prev) =>
                        prev.filter((n) => n.chat._id !== group.chat._id),
                      );
                    }}
                  >
                    <Avatar.Root size="sm">
                      <Avatar.Image src={group.chat.isGroupChat ? undefined : last.sender?.picture} />
                      <Avatar.Fallback
                        name={group.chat.isGroupChat ? group.chat.chatName : last.sender?.name}
                      />
                    </Avatar.Root>
                    <Box minW={0}>
                      <Text fontWeight="700" truncate>
                        {group.chat.isGroupChat
                          ? group.chat.chatName
                          : getSender(user, group.chat.users)}
                      </Text>
                      <Text fontSize="xs" color="gray.400" truncate>
                        {group.messages.length > 1
                          ? `${group.messages.length} new messages`
                          : messagePreview(last)}
                      </Text>
                    </Box>
                  </Menu.Item>
                );
              })}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {/* PROFILE */}
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box
            as="button"
            type="button"
            aria-label="Account menu"
            borderRadius="full"
            p="2px"
            bg="var(--gradient)"
            cursor="pointer"
            transition="transform 0.15s"
            _hover={{ transform: "scale(1.06)" }}
          >
            <Avatar.Root size="sm" border="2px solid var(--bg)">
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
  );
};

export default SideDrawer;
