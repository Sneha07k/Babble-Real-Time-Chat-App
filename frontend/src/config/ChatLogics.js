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
// ---- times and dates shown in the chat UI ----

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (date) =>
  Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

// "14:05" (follows the viewer's locale: 12h or 24h)
export const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const isSameDay = (a, b) =>
  !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime();

// separator between days: "Today", "Yesterday", "Monday", "12 Oct 2026"
export const formatDayLabel = (date) => {
  const diff = daysAgo(date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Date(date).toLocaleDateString([], { weekday: "long" });
  return new Date(date).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// right side of a chat list row: time today, otherwise a short date
export const formatChatListTime = (date) => {
  if (!date) return "";
  const diff = daysAgo(date);
  if (diff === 0) return formatTime(date);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Date(date).toLocaleDateString([], { weekday: "short" });
  return new Date(date).toLocaleDateString([], { day: "numeric", month: "short" });
};
