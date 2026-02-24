import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Mood } from "../types";

/**
 * VISION TRANSFORMERS (ViT) EXPLAINED:
 * Vision Transformers treat an image as a sequence of patches (like words in a sentence).
 * Each patch is flattened and projected into an embedding space. 
 * Position embeddings are added to maintain spatial information.
 * The Transformer encoder then processes these patches using self-attention to understand 
 * global relationships between different parts of the image.
 */

/**
 * TRANSFORMER DECODERS & AUTOREGRESSIVE GENERATION:
 * Decoders generate text word-by-word (token-by-token).
 * In each step, the model predicts the next token based on all previously generated tokens.
 * This is "autoregressive" because the output of one step becomes the input for the next.
 */

/**
 * CROSS-ATTENTION:
 * This is the bridge between the Vision Encoder and the Text Decoder.
 * The decoder "attends" to the image embeddings produced by the encoder.
 * This allows the model to "look" at specific parts of the image while deciding 
 * which word to generate next.
 */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateCaption(
  imageData: string, 
  mimeType: string, 
  temperature: number = 0.7
): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  /**
   * TEMPERATURE & CREATIVITY:
   * Temperature scales the logits before the softmax layer in the decoder.
   * - Low temperature (< 1.0): Makes the model more confident and deterministic (factual).
   * - High temperature (> 1.0): Increases diversity and "creativity" by flattening the probability distribution.
   */

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: imageData, mimeType } },
        { text: "Suggest a catchy, creative, and contextually relevant caption for this image. It should be something someone would actually use on social media or in a photo album. Keep it engaging." }
      ]
    },
    config: {
      temperature: 0.7, // Allow some creativity for the base caption
    }
  });

  return response.text || "No caption generated.";
}

export async function transformCaption(
  baseCaption: string, 
  mood: Mood, 
  temperature: number = 0.7
): Promise<string> {
  if (mood === 'Normal') return baseCaption;

  const model = "gemini-3-flash-preview";
  
  const moodPrompts: Record<Mood, string> = {
    Normal: "",
    Happy: "Rewrite this caption to be incredibly joyful, vibrant, and full of positive energy. Perfect for a happy memory.",
    Sad: "Rewrite this caption to be deeply melancholic, soulful, and evocative of a somber or reflective moment.",
    Funny: "Rewrite this caption to be hilarious, witty, or a clever pun. Make it something that would get a laugh.",
    Romantic: "Rewrite this caption to be dreamy, intimate, and deeply romantic. Use soft and affectionate language.",
    Dramatic: "Rewrite this caption to be intense, cinematic, and epic. Make it feel like a high-stakes movie moment.",
    Inspirational: "Rewrite this caption as a powerful motivational quote or a deeply moving life lesson.",
    Poetic: "Rewrite this caption as a beautiful, rhythmic, and metaphorical short poem or a piece of elegant prose."
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: `Original Caption: "${baseCaption}"\n\nTask: ${moodPrompts[mood]}\n\nRequirements:\n- Preserve the core meaning.\n- Do not repeat the prompt.\n- Be creative but stay relevant to the original description.`,
    config: {
      temperature,
    }
  });

  return response.text || baseCaption;
}
