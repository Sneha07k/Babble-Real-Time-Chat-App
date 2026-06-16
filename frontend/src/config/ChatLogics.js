export const getSender = (loggedUser, users) => {
  if (!loggedUser || !users || users.length < 2) {
    return "";
  }

  return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
};

export const isSameSender = (messages, m, i, userId) => {
  return (
    i < messages.length - 1 &&
    (messages[i + 1]?.sender?._id !== m?.sender?._id ||
      messages[i + 1]?.sender?._id === undefined) &&
    m?.sender?._id !== userId
  );
};

export const isLastMessage = (messages, i, userId) => {
  return (
    i === messages.length - 1 &&
    messages[messages.length - 1]?.sender?._id !== userId &&
    messages[messages.length - 1]?.sender?._id
  );
};

export const isSameSenderMargin = (messages, m, i, userId) => {
  const nextMessage = messages[i + 1];
  const currentSenderId = m?.sender?._id;

  if (
    i < messages.length - 1 &&
    nextMessage?.sender?._id === currentSenderId &&
    currentSenderId !== userId
  ) {
    return 33;
  } else if (
    (i < messages.length - 1 &&
      nextMessage?.sender?._id !== currentSenderId &&
      currentSenderId !== userId) ||
    (i === messages.length - 1 && currentSenderId !== userId)
  ) {
    return 0;
  } else {
    return "auto";
  }
};

export const isSameUser = (messages, m, i) => {
  const currentSenderId = m?.sender?._id;
  const prevSenderId = messages[i - 1]?.sender?._id;

  return i > 0 && prevSenderId === currentSenderId;
};