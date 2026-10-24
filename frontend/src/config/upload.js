// photos, videos and voice notes go straight from the browser to Cloudinary
// (the same account and unsigned preset the sign-up photo uses)

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dbkqtoa4t";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "OGC-Mern-Chat-App";

const MB = 1024 * 1024;
export const MAX_SIZE = { image: 10 * MB, video: 50 * MB, audio: 10 * MB };

export const kindOf = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
};

// rejects with a readable message; onProgress gets 0-100
export const uploadMedia = (file, onProgress = () => {}) =>
  new Promise((resolve, reject) => {
    const kind = kindOf(file);
    if (!kind) return reject(new Error("Only photos, videos and audio can be sent"));
    if (file.size > MAX_SIZE[kind]) {
      return reject(new Error(`That ${kind} is too big (max ${MAX_SIZE[kind] / MB} MB)`));
    }

    // Cloudinary files audio under its "video" type
    const resource = kind === "image" ? "image" : "video";
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resource}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch (error) {
        // handled below
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        resolve({
          url: data.secure_url,
          kind,
          width: data.width,
          height: data.height,
          duration: data.duration,
        });
      } else {
        reject(new Error(data.error?.message || "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection"));
    xhr.send(form);
  });

// Cloudinary converts on the fly, so every browser gets a format it can play
export const playableUrl = ({ url, kind }) => {
  if (kind === "audio") return url.replace(/\.\w+$/, ".mp3");
  if (kind === "video") return url.replace(/\.\w+$/, ".mp4");
  return url;
};
