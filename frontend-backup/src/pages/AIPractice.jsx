import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { chatWithAI } from "../services/aiService";
import { getLesson } from "../services/lessonService";

function AIPractice() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend() {
    try {
      if (!message.trim()) return;

      const updatedMessages = [
        ...messages,
        {
          sender: "user",
          text: message,
        },
      ];

      setMessages(updatedMessages);
      setMessage("");

      setLoading(true);

      const data = await chatWithAI(Number(lessonId), updatedMessages);

      setMessages([
        ...updatedMessages,
        {
          sender: "ai",
          text: data.reply,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }
useEffect(() => {
  async function loadLesson() {
    try {
      const data = await getLesson(lessonId);

      setLesson(data);

      setMessages([
        {
          sender: "ai",
          text: data.ai.greeting,
        },
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  loadLesson();
}, [lessonId]);
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">AI Practice</h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={() =>
            setMessages([
              {
                sender: "ai",
                text: "Bonjour ! Je suis votre serveur aujourd'hui. Que désirez-vous ?",
              },
            ])
          }
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
        >
          New Conversation
        </button>
      </div>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                <p className="text-sm font-semibold mb-1">
                  {msg.sender === "user"
                    ? "You"
                    : (lesson?.ai?.role ?? "French AI")}{" "}
                </p>

                <p>{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="bg-green-100 p-3 rounded-lg w-fit">
              🤖 Typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSend();
            }
          }}
          placeholder="Type in French..."
          className="w-full border rounded-lg p-3"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default AIPractice;
