// File: utils/tts.js
// ============================
// Text-to-Speech (TTS) utilities and GitHub upload
// ============================

import fs from "fs";
import path from "path";
import axios from "axios";
import gTTS from "gtts";
import { exec } from "child_process";
import util from "util";

// Promisified version of exec for async/await
const execPromise = util.promisify(exec);

// GitHub configuration from environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_USERNAME;
const REPO_NAME = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";

/**
 * Sanitize text for TTS conversion.
 * Removes special characters, replaces line breaks with periods.
 *
 * @param {string} text - Text to sanitize.
 * @returns {string} - Sanitized text suitable for TTS.
 */
function sanitizeText(text) {
  return text
    .replace(/[*_~`#]/g, "") // Remove markdown/special characters
    .replace(/•/g, "-") // Replace bullet points with dash
    .replace(/[\r\n]+/g, ". ") // Replace newlines with periods
    .trim();
}

/**
 * Convert text to speech (MP3 → OGG).
 *
 * @param {string} text - Text to convert to audio.
 * @param {string} lang - Language code (default: "en").
 * @returns {Promise<{mp3File: string, oggFile: string}>} - Paths of generated audio files.
 */
export async function textToSpeech(text, lang = "en") {
  if (!text || !text.trim()) throw new Error("No text provided for TTS");
  if (text.length > 2000) throw new Error("Text too long (>2000 chars)");

  const sanitizedText = sanitizeText(text);
  const tmpDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const mp3File = path.join(tmpDir, `voice_${Date.now()}.mp3`);
  const oggFile = mp3File.replace(".mp3", ".ogg");

  // Generate MP3 using gTTS
  await new Promise((resolve, reject) =>
    new gTTS(sanitizedText, lang).save(mp3File, (err) =>
      err ? reject(err) : resolve()
    )
  );

  // Convert MP3 → OGG using ffmpeg
  await execPromise(
    `ffmpeg -y -i "${mp3File}" -c:a libopus -b:a 64k "${oggFile}"`
  );

  return { mp3File, oggFile };
}

/**
 * Upload a file to a GitHub repository.
 *
 * @param {string} filePath - Local path of the file to upload.
 * @returns {Promise<string>} - Public URL of the uploaded file on GitHub.
 */
export async function uploadToGitHub(filePath) {
  const fileContent = fs.readFileSync(filePath, { encoding: "base64" });
  const fileName = `v_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}.ogg`;
  const githubUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`;

  try {
    let sha = null;

    // Check if file already exists (to get SHA for updates)
    try {
      const getRes = await axios.get(githubUrl, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      });
      sha = getRes.data.sha;
    } catch (_) {
      // File does not exist, continue
    }

    // Upload or update file on GitHub
    await axios.put(
      githubUrl,
      {
        message: `Add TTS voice file ${fileName}`,
        content: fileContent,
        branch: BRANCH,
        sha,
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    throw new Error(
      "GitHub upload failed: " + (err.response?.data || err.message)
    );
  }

  // Delete local file after successful upload
  fs.unlinkSync(filePath);

  // Return raw GitHub URL for public access
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${fileName}`;
}

/**
 * Convert text to speech and upload the resulting OGG file to GitHub.
 *
 * @param {string} text - Text to convert to speech.
 * @param {string} lang - Language code for TTS (default: "en").
 * @returns {Promise<string>} - Public URL of uploaded OGG audio.
 */
export async function textToSpeechAndUpload(text, lang = "en") {
  const { oggFile } = await textToSpeech(text, lang);
  return await uploadToGitHub(oggFile);
}
