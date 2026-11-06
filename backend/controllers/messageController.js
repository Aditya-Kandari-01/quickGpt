import Chat from "../models/Chat.js";
import imagekit from "../configs/imageKit.js";
import openai from "../configs/openai.js";
import axios from "axios";

// Text based AI Chat Message Controller
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, prompt } = req.body;
    const chat = await Chat.findOne({
      userId,
      _id: chatId,
    });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    const { choices } = await openai.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const aiMessage = choices[0].message;

    const reply = {
      role: "assistant",
      content:
        typeof aiMessage.content === "string"
          ? aiMessage.content
          : JSON.stringify(aiMessage.content), // fallback
      timestamp: Date.now(),
      isImage: false,
    };

    chat.messages.push(reply);
    await chat.save();

    const savedReply = chat.messages[chat.messages.length - 1];

    return res.json({
      success: true,
      reply: savedReply
    });

  } catch (error) {
    console.error("textMessageController error:", error);
    if (res.headersSent) {
      return;
    }

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Image Generation Message Controller

export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { prompt, chatId, isPublished } = req.body;
    console.log("BACKEND IS PUBLISHED:", isPublished);

    // Find Chat
    const chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Chat Messages
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });
    // Encode the prompt
    const encodedPrompt = encodeURIComponent(prompt);

    // Construct ImageKit Ai Generation URL
    const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/cloneGpt/${Date.now()}.png?tr=w-800,h-800`;

    // Trigger generation by fetching from imagekit(Polling)
    let aiImageResponse;

    const maxAttempts = 60;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {

        aiImageResponse = await axios.get(generatedImageUrl, {
            responseType: "arraybuffer"
        });
        

        const isIntermediate =
            aiImageResponse.headers["is-intermediate-response"] === "true";

        const contentType =
            aiImageResponse.headers["content-type"];


        // Image is ready
        if (!isIntermediate && contentType?.startsWith("image/")) {
            console.log("IMAGE GENERATED SUCCESSFULLY!");
            break;
        }

        // Processing finished but response isn't an image
        if (!isIntermediate) {
            throw new Error(
                `Image generation failed. Content-Type: ${contentType}`
            );
        }

        // Stop after maximum attempts
        if (attempt === maxAttempts) {
            throw new Error("Image generation timed out.");
        }

        // Wait 2 seconds before checking again
        await delay(2000);
    }

    // Convert To Base64
    const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data).toString("base64")}`;

    // Upload to Imagekit Media Library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "cloneGpt",
    });


    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished: false,
    };
    chat.messages.push(reply);
    await chat.save();

    return res.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("imageMessageController error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
