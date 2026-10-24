import { useEffect } from "react";
import axios from "axios";
import { useHistory, useParams } from "react-router-dom";
import { Box, Spinner } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import { toaster } from "../components/ui/toaster";

// /invite/:code — logged in: open a chat with the inviter;
// logged out: go to the home page to sign up first, keeping the code
const InvitePage = () => {
  const { code } = useParams();
  const history = useHistory();
  const { user, setChats, setSelectedChat } = ChatState();

  useEffect(() => {
    if (!user) {
      history.replace(`/?invite=${encodeURIComponent(code)}`);
      return;
    }

    axios
      .post(
        `/api/user/invite/${encodeURIComponent(code)}/accept`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } },
      )
      .then(({ data }) => {
        setChats((prev) =>
          prev.some((c) => c._id === data._id) ? prev : [data, ...prev],
        );
        setSelectedChat(data);
      })
      .catch((error) => {
        toaster.create({
          description:
            error.response?.data?.message || "This invite link is not valid",
          type: "error",
        });
      })
      .finally(() => history.replace("/chats"));
  }, [code, user, history, setChats, setSelectedChat]);

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="linear-gradient(135deg, var(--bg) 0%, var(--bg-2) 100%)"
    >
      <Spinner size="xl" color="var(--accent-light)" borderWidth="4px" />
    </Box>
  );
};

export default InvitePage;
