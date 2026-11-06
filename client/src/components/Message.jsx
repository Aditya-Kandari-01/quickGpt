
import React, { useEffect } from "react";
import Markdown from "react-markdown";
import Prism from "prismjs";

const Message = ({ message, onPublish }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  const isUser = message.role === "user";

  return (
    <div
      className={`w-full flex mb-6 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`${
          isUser
            ? "max-w-[75%] bg-primary/15 dark:bg-[#583C79]/30 rounded-2xl px-4 py-3"
            : "max-w-[85%]"
        }`}
      >
        {message.isImage ? (
          <div className="flex flex-col gap-3">
            <img
              src={message.content}
              alt="Generated image"
              className="w-full max-w-md mt-2 rounded-xl"
            />

            {!message.isPublished && (
              <button
                onClick={() => onPublish(message._id)}
                className="bg-primary text-white px-4 py-2 rounded-md w-fit text-sm"
              >
                Publish to Community
              </button>
            )}

            {message.isPublished && (
              <p className="text-sm text-green-500">
                Published to Community
              </p>
            )}
          </div>
        ) : (
          <div
            className={`text-sm ${
              isUser
                ? "text-gray-800 dark:text-white"
                : "dark:text-primary"
            } reset-tw`}
          >
            <Markdown>{message.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
