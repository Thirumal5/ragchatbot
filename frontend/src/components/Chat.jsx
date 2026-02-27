import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage = input;
    setMessage((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/chat",
        { message: userMessage }
      );

      setMessage((prev) => [
        ...prev,
        { text: response.data.reply, sender: "ai" },
      ]);
    } catch {
      setMessage((prev) => [
        ...prev,
        { text: "Unable to process request. Please try again.", sender: "ai" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen bg-[#0b1f33] text-white flex flex-col">

      <div className="border-b border-blue-900 px-8 py-5 text-xl font-semibold tracking-wide bg-[#0e2a47]">
        DocNow AI
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-10 space-y-10 max-w-3xl w-full mx-auto">

        {message.map((mess, i) => (
          <div key={i} className="flex flex-col space-y-3">

            <div className={`text-xs font-medium tracking-wide ${
              mess.sender === "user" ? "text-blue-300" : "text-gray-400"
            }`}>
              {mess.sender === "user" ? "Patient" : "Doctor AI"}
            </div>

            <div className={`text-base leading-relaxed ${
              mess.sender === "user"
                ? "text-white"
                : "text-gray-200"
            }`}>
              <ReactMarkdown>{mess.text}</ReactMarkdown>
            </div>

          </div>
        ))}

        {loading && (
          <div className="text-blue-300 text-sm animate-pulse">
            Analyzing medical context...
          </div>
        )}

        <div ref={ref}></div>
      </div>

      <div className="border-t border-blue-900 p-6 bg-[#0e2a47]">
        <div className="max-w-3xl mx-auto flex items-center gap-4 bg-[#102f4f] rounded-lg px-5 py-4">

          <input
            type="text"
            value={input}
            placeholder="Describe your symptoms..."
            className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-400"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition"
          >
            Consult
          </button>

        </div>
      </div>

    </div>
  );
}