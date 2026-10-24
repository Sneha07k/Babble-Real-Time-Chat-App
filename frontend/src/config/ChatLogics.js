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

// "online" is handled by the caller; this covers everyone else
export const formatLastSeen = (date) => {
  if (!date) return "offline";
  const minutes = Math.round((Date.now() - new Date(date)) / 60000);
  if (minutes < 1) return "last seen just now";
  if (minutes < 60) return `last seen ${minutes} min ago`;
  const diff = daysAgo(date);
  if (diff === 0) return `last seen today at ${formatTime(date)}`;
  if (diff === 1) return `last seen yesterday at ${formatTime(date)}`;
  return `last seen ${new Date(date).toLocaleDateString([], { day: "numeric", month: "short" })}`;
};

// one line describing a message, for chat lists and notifications
export const messagePreview = (message) => {
  if (!message) return "";
  const labels = { image: "📷 Photo", video: "🎥 Video", audio: "🎤 Voice message" };
  const label = labels[message.attachment?.kind];
  if (label && message.content) return `${label} · ${message.content}`;
  return label || message.content || "";
};

// "1:05" for voice notes and videos
export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
