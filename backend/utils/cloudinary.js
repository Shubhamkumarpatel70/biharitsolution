const crypto = require("crypto");

function getConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Render.");
    error.code = "CLOUDINARY_NOT_CONFIGURED";
    throw error;
  }
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
}

function makeSignature(params, secret) {
  const canonical = Object.keys(params).sort().filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${key}=${params[key]}`).join("&");
  return crypto.createHash("sha1").update(canonical + secret).digest("hex");
}

async function uploadImageBuffer(buffer, mimetype, folder, publicId) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error("Image file is empty.");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(String(mimetype).toLowerCase())) throw new Error("Only JPG, PNG, WebP and GIF images are supported.");
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp, ...(publicId ? { public_id: publicId } : {}) };
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimetype }), "upload");
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  if (publicId) form.append("public_id", publicId);
  form.append("signature", makeSignature(params, config.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok || !result.secure_url || !result.public_id) throw new Error(result.error?.message || "Cloudinary image upload failed.");
  return { url: result.secure_url, publicId: result.public_id, format: result.format, bytes: result.bytes };
}

async function uploadDataUri(dataUri, folder) {
  if (typeof dataUri !== "string" || !dataUri.startsWith("data:image/")) return dataUri;
  const match = dataUri.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error("Invalid image data. Upload a JPG, PNG, WebP or GIF image.");
  return (await uploadImageBuffer(Buffer.from(match[2], "base64"), match[1].toLowerCase(), folder)).url;
}

function publicIdFromUrl(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl.includes("res.cloudinary.com")) return null;
  try {
    const pathname = new URL(imageUrl).pathname;
    const uploadIndex = pathname.indexOf("/upload/");
    if (uploadIndex < 0) return null;
    const publicId = pathname.slice(uploadIndex + 8).replace(/^v\d+\//, "");
    return publicId.replace(/\.[a-z0-9]+$/i, "") || null;
  } catch (_) { return null; }
}

async function deleteImageByUrl(imageUrl) {
  const publicId = publicIdFromUrl(imageUrl);
  if (!publicId) return false;
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", makeSignature(params, config.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, { method: "POST", body: form });
  const result = await response.json();
  return response.ok && ["ok", "not found"].includes(result.result);
}

async function moveInlineImagesToCloudinary(html, folder = "askc-technologies/agreements") {
  if (typeof html !== "string" || !html.includes("data:image/")) return html;
  const pattern = /data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)/gi;
  const matches = [...html.matchAll(pattern)];
  let output = html;
  for (const match of matches) output = output.replace(match[0], await uploadDataUri(match[0], folder));
  return output;
}

module.exports = { uploadImageBuffer, uploadDataUri, deleteImageByUrl, moveInlineImagesToCloudinary, publicIdFromUrl };
