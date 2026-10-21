const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const ffmpegStatic = require("ffmpeg-static");

function safeName(value, fallback = "Card Sale Manager") {
  return String(value || fallback).replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim().slice(0, 110) || fallback;
}

function ffmpegPath() {
  const resolved = String(ffmpegStatic || "");
  return resolved.includes("app.asar") ? resolved.replace("app.asar", "app.asar.unpacked") : resolved;
}

function decodeDataUrl(value) {
  const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/s.exec(String(value || ""));
  if (!match) throw new Error("The generated image data was not recognized.");
  return Buffer.from(match[2], "base64");
}

async function uniqueOutputPath(folder, baseName, extension) {
  await fs.promises.mkdir(folder, { recursive: true });
  const clean = safeName(baseName);
  let candidate = path.join(folder, `${clean}.${extension}`);
  let counter = 2;
  while (fs.existsSync(candidate)) candidate = path.join(folder, `${clean} (${counter++}).${extension}`);
  return candidate;
}

async function saveGeneratedImages(downloadsFolder, payload = {}) {
  const pages = Array.isArray(payload.pages) ? payload.pages.filter(Boolean) : [];
  if (!pages.length) throw new Error("There are no generated order-card pages to save.");
  const stamp = new Date().toISOString().slice(0, 10);
  const base = safeName(payload.baseName || `Card Order ${stamp}`);
  const paths = [];
  for (let index = 0; index < pages.length; index += 1) {
    const suffix = pages.length > 1 ? ` ${String(index + 1).padStart(2, "0")}` : "";
    const target = await uniqueOutputPath(downloadsFolder, `${base}${suffix}`, "png");
    await fs.promises.writeFile(target, decodeDataUrl(pages[index]));
    paths.push(target);
  }
  return paths;
}

function parseTime(value) {
  const match = /(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(String(value || ""));
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : 0;
}

function runFfmpeg(args, duration, progress, processRef) {
  return new Promise((resolve, reject) => {
    const executable = ffmpegPath();
    if (!executable || !fs.existsSync(executable)) return reject(new Error("The local video encoder is missing. Reinstall Card Sale Manager and try again."));
    const child = spawn(executable, args, { windowsHide: true });
    processRef.current = child;
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr = `${stderr}${text}`.slice(-12000);
      const matches = [...text.matchAll(/time=(\d+:\d+:\d+(?:\.\d+)?)/g)];
      const seconds = matches.length ? parseTime(matches.at(-1)[1]) : 0;
      if (seconds && duration) progress?.({ percent: Math.max(1, Math.min(99, Math.round((seconds / duration) * 100))), message: `Rendering video… ${Math.min(duration, seconds).toFixed(1)} of ${duration.toFixed(1)} seconds` });
    });
    child.on("error", reject);
    child.on("close", (code) => {
      processRef.current = null;
      if (code === 0) resolve();
      else if (code === null) reject(new Error("Trailer rendering was canceled."));
      else reject(new Error(`The trailer encoder stopped unexpectedly. ${stderr.split(/\r?\n/).filter(Boolean).slice(-2).join(" ")}`));
    });
  });
}

function transitionName(style) {
  return ({ sports: "slideleft", vintage: "fadeblack", minimal: "fade", clean: "smoothleft" })[style] || "fade";
}

async function renderTrailer({ app, payload, progress, processRef }) {
  const frames = Array.isArray(payload?.frames) ? payload.frames.filter(Boolean) : [];
  if (!frames.length) throw new Error("Choose at least one usable card image for the trailer.");
  const duration = Math.max(5, Math.min(180, Number(payload.duration || 30)));
  const width = Math.max(320, Math.floor(Number(payload.width || 1080) / (payload.preview ? 2 : 1)));
  const height = Math.max(320, Math.floor(Number(payload.height || 1920) / (payload.preview ? 2 : 1)));
  const evenWidth = width % 2 ? width - 1 : width;
  const evenHeight = height % 2 ? height - 1 : height;
  const transition = Math.min(0.45, Math.max(0.15, Number(payload.transitionDuration || 0.32)));
  const segment = (duration + (frames.length - 1) * transition) / frames.length;
  const temp = await fs.promises.mkdtemp(path.join(app.getPath("temp"), "csm-trailer-"));
  const framePaths = [];
  try {
    progress?.({ percent: 2, message: "Preparing trailer scenes…" });
    for (let index = 0; index < frames.length; index += 1) {
      const framePath = path.join(temp, `scene-${String(index + 1).padStart(3, "0")}.png`);
      await fs.promises.writeFile(framePath, decodeDataUrl(frames[index]));
      framePaths.push(framePath);
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const formatName = safeName(payload.formatName || "Vertical");
    const outputFolder = payload.preview ? temp : app.getPath("downloads");
    const output = payload.preview
      ? path.join(temp, "CSM Trailer Preview.mp4")
      : await uniqueOutputPath(outputFolder, `${safeName(payload.saleName || "Sale")} Trailer ${formatName} ${stamp}`, "mp4");
    const args = ["-y"];
    framePaths.forEach((frame) => args.push("-loop", "1", "-t", segment.toFixed(4), "-i", frame));
    const musicPath = String(payload.musicPath || "");
    const hasMusic = musicPath && fs.existsSync(musicPath);
    if (hasMusic) args.push("-stream_loop", "-1", "-ss", String(Math.max(0, Number(payload.musicStart || 0))), "-i", musicPath);
    const filters = framePaths.map((_frame, index) => `[${index}:v]scale=${evenWidth}:${evenHeight}:flags=lanczos,setsar=1,fps=30,format=yuv420p[v${index}]`);
    let videoLabel = "v0";
    for (let index = 1; index < framePaths.length; index += 1) {
      const next = `x${index}`;
      const offset = index * (segment - transition);
      filters.push(`[${videoLabel}][v${index}]xfade=transition=${transitionName(payload.style)}:duration=${transition.toFixed(3)}:offset=${offset.toFixed(3)}[${next}]`);
      videoLabel = next;
    }
    filters.push(`[${videoLabel}]trim=duration=${duration.toFixed(3)},setpts=PTS-STARTPTS[vout]`);
    if (hasMusic) {
      const audioIndex = framePaths.length;
      const volume = Math.max(0, Math.min(2, Number(payload.musicVolume ?? 0.7)));
      const fadeOutStart = Math.max(0, duration - 0.8);
      filters.push(`[${audioIndex}:a]volume=${volume.toFixed(2)},afade=t=in:st=0:d=0.5,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.8,atrim=duration=${duration.toFixed(3)},asetpts=PTS-STARTPTS[aout]`);
    }
    args.push("-filter_complex", filters.join(";"), "-map", "[vout]");
    if (hasMusic) args.push("-map", "[aout]", "-c:a", "aac", "-b:a", "192k"); else args.push("-an");
    args.push("-c:v", "libx264", "-preset", payload.preview ? "veryfast" : "medium", "-crf", payload.preview ? "28" : "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-t", duration.toFixed(3), output);
    await runFfmpeg(args, duration, progress, processRef);
    progress?.({ percent: 100, message: payload.preview ? "Preview ready." : "Trailer ready." });
    return { success: true, filePath: output, preview: Boolean(payload.preview), tempFolder: payload.preview ? temp : "" };
  } catch (error) {
    await fs.promises.rm(temp, { recursive: true, force: true }).catch(() => {});
    throw error;
  } finally {
    if (!payload.preview) await fs.promises.rm(temp, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { renderTrailer, saveGeneratedImages, safeName };
