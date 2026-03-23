import { response } from "express";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
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
    res.json({
      success: true,
      reply,
    });
    chat.messages.push(reply);
    await chat.save();
    await User.updateOne({
      _id: userId,
    });
  } catch (error) {
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

    // Find Chat
    const chat = await Chat.findOne({ userId, _id: chatId });

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

    // Trigger generation by fetching from imagekit
    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
    });

    // Convert To Base64
    const base64Image = `data:image/png;base64 ,${Buffer.from(aiImageResponse.data, "binary").toString("base64")}`;

    // Upload to Imagekit Media Library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "cloneGpt",
    });
    const reply = {
      role: "assitant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished,
    };
    res.json({
      success: true,
      reply,
    });
    chat.messages.push(reply);
    await chat.save();
    await User.updateOne({
      _id: userId,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
