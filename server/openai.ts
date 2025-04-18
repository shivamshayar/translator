import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";
const WHISPER_MODEL = "whisper-1";

// Use environment variable for API key
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in environment variables");
}

const openai = new OpenAI({ apiKey: API_KEY });

/**
 * Transcribes audio content using OpenAI's Whisper model
 * @param audioBase64 Base64 encoded audio content
 * @returns Transcribed text
 */
export async function transcribeAudio(audioBase64: string): Promise<string> {
  let tempFilePath = '';
  try {
    // Log audio data information
    console.log(`Received audio base64 data of length: ${audioBase64.length} characters`);
    
    // Convert base64 to buffer
    const buffer = Buffer.from(audioBase64, 'base64');
    console.log(`Converted to buffer of size: ${buffer.length} bytes`);
    
    // Skip processing if buffer is too small
    if (buffer.length < 100) {
      console.warn("Audio buffer too small, likely no speech detected");
      return "";
    }
    
    // Create a temporary file with a unique name
    const fs = require('fs');
    tempFilePath = `/tmp/audio-${Date.now()}-${Math.floor(Math.random() * 10000)}.webm`;
    fs.writeFileSync(tempFilePath, buffer);
    console.log(`Saved audio to temporary file: ${tempFilePath}`);
    
    // Create a file with specific format that OpenAI requires
    const file = fs.createReadStream(tempFilePath);
    
    try {
      console.log("Sending audio to OpenAI for transcription...");
      
      // Request transcription from OpenAI
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: WHISPER_MODEL,
        language: "en",  // Specify language to improve accuracy
        response_format: "json",
        temperature: 0.2  // Lower temperature for more accurate transcription
      });
      
      console.log(`Transcription successful, result: "${transcription.text}"`);
      
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
        console.log("Temporary audio file deleted");
      } catch (cleanupError) {
        console.warn("Failed to delete temporary file:", cleanupError);
      }
      
      return transcription.text;
    } catch (transcriptionError: any) {
      console.error("OpenAI transcription error:", transcriptionError);
      
      // Log detailed API error information
      if (transcriptionError.response) {
        console.error("API Error Status:", transcriptionError.response.status);
        console.error("API Error Data:", transcriptionError.response.data);
      }
      
      // Clean up temporary file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.warn("Failed to delete temporary file during error handling:", cleanupError);
      }
      
      throw transcriptionError;
    }
  } catch (error: any) {
    console.error("Error in transcribeAudio:", error);
    
    // Attempt to clean up temporary file if it exists
    if (tempFilePath) {
      try {
        if (require('fs').existsSync(tempFilePath)) {
          require('fs').unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.warn("Failed to delete temporary file during error handling:", cleanupError);
      }
    }
    
    throw new Error(`Failed to transcribe audio: ${error.message || "Unknown error"}`);
  }
}

/**
 * Translates text to the target language using OpenAI's GPT-4o model
 * @param text Text to translate
 * @param targetLanguage Language to translate to
 * @returns Translated text
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text into ${targetLanguage}. Maintain the original tone, meaning, and context as closely as possible.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3, // Lower temperature for more accurate translations
    });

    return response.choices[0].message.content || text;
  } catch (error: any) {
    console.error("Error in translateText:", error);
    throw new Error(`Failed to translate text: ${error.message || "Unknown error"}`);
  }
}

/**
 * Generate text-to-speech audio for the translated text
 * @param text Text to convert to speech
 * @param voice Voice to use (alloy, echo, fable, onyx, nova, or shimmer)
 * @param language Language code for proper pronunciation
 * @returns Base64 encoded audio
 */
export async function generateSpeech(text: string, voice = "nova", language = "en"): Promise<string> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  } catch (error: any) {
    console.error("Error in generateSpeech:", error);
    throw new Error(`Failed to generate speech: ${error.message || "Unknown error"}`);
  }
}
