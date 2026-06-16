import React from "react";
import ScrollableFeed from "react-scrollable-feed";
import { isSameSender, isSameSenderMargin, isSameUser } from "../config/ChatLogics";
import { isLastMessage } from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import { Tooltip,Avatar, useRecipe } from "@chakra-ui/react";


const ScorllableChat = ({ messages }) => {
  const { user } = ChatState();

  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <ScrollableFeed>
        {messages &&
          messages.map((m, i) => (
            <div key={m._id} style={{ display: "flex", alignItems: "center" }}>
              {/* only show avatar for other person's messages */}
              {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) &&  (
                <Avatar.Root size="sm">
                  <Avatar.Fallback name={m.sender?.name} />
                  <Avatar.Image src={m.sender?.picture} />
                </Avatar.Root>
              )}
              <span
                style={{
                  backgroundColor:
                    m?.sender?._id === user?._id ? "#61b9ec" : "#4dcd7e",
                  borderRadius: "20px",
                  padding: "5px 15px",
                  maxWidth: "75%",
                  marginLeft: isSameSenderMargin(messages, m, i, user?._id),
                  marginTop: isSameUser(messages, m, i, user?._id) ? 3 : 10,
                }}
              >
                {m.content}
              </span>
            </div>
          ))}
      </ScrollableFeed>
    </div>
  );
};

export default ScorllableChat;
