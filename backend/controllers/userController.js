import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Chat from "../models/Chat.js"

// Token Generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// API for user registration

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    return res.json({
      success: true,
      token,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API To Login User

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (passwordMatched) {
        const token = generateToken(user._id);
        return res.json({
          success: true,
          token,
        });
      }
    }
    return res.json({
      success: false,
      message: "Invalid email or password",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// To get the user data
export const getUser = async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// To get the published images

export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      {
        $unwind: "$messages",
      },
      {
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true,
        },
      },
      {
        $sort: {
          "messages.timestamp": -1
        }
      },
      {
        $project: {
          _id: 0,
          messageId: "$messages._id",
          imageUrl: "$messages.content",
          userName: "$userName",
          timestamp: "$messages.timestamp",
        }
      },
    ]);

    return res.json({
      success: true,
      images: publishedImageMessages,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};


// to publish the images 
export const publishImage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, messageId } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const message = chat.messages.id(messageId);

    if (!message || !message.isImage) {
      return res.status(404).json({
        success: false,
        message: "Image message not found",
      });
    }

    message.isPublished = true;

    await chat.save();

    return res.json({
      success: true,
      message: "Image published successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};