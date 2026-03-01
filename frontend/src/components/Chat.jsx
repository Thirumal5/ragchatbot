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

  function getRiskBadge(text) {
    if (text?.includes("Severe 🔴")) {
      return <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">Severe 🔴</span>;
    }
    if (text?.includes("Moderate 🟡")) {
      return <span className="ml-2 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-600">Moderate 🟡</span>;
    }
    if (text?.includes("Mild 🟢")) {
      return <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">Mild 🟢</span>;
    }
    return null;
  }

 return (
  <div className="h-screen bg-[#f4f8fb] flex flex-col text-gray-800">

    <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shadow-sm">
      <div className="text-2xl font-semibold text-teal-600">DocNow AI</div>
      <div className="text-sm text-gray-500">24/7 Smart Medical Assistant</div>
    </div>

    <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 max-w-4xl w-full mx-auto space-y-5 no-scrollbar">

      {message.map((mess, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 ${
            mess.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {mess.sender === "ai" && (
            <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow">
              D
            </div>
          )}

          <div
            className={`max-w-xl px-5 py-3 rounded-2xl shadow text-[15px] leading-relaxed ${
              mess.sender === "user"
                ? "bg-teal-500 text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            <ReactMarkdown>{mess.text}</ReactMarkdown>
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow">
            D
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl shadow border border-gray-200">
            Doctor is analyzing...
          </div>
        </div>
      )}

      <div ref={ref}></div>
    </div>

    <div className="sticky bottom-0 bg-[#f4f8fb] pt-4 pb-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg border border-gray-200 rounded-2xl px-6 py-4 flex items-center gap-4">

        <input
          type="text"
          value={input}
          placeholder="Describe your symptoms..."
          className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-[15px]"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button
          onClick={handleSend}
          className="bg-teal-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-teal-700 transition shadow"
        >
          Consult
        </button>

      </div>
    </div>

  </div>
);
}