import { useEffect, useRef, useState } from "react";
import logo from "../assets/chatbot.png";
import axios from "axios";
import ReactMarkdown from "react-markdown";



export default function Chat() {
  const [input, setinput] = useState("");
  const [message, setmessage] = useState([]);
  const[loading,Setloading]=useState(false)
  const ref=useRef(null)
  useEffect(()=>{
       ref.current?.scrollIntoView({ behavior: "smooth" });
  },[message])
  async function handlebutton() {
    if (!input) return;

    setmessage(prev => [
      ...prev,
      { text: input, sender: "user" }
    ]);

    setinput("");
    Setloading(true)
    try {
      const response = await axios.post(
        "http://localhost:5000/api/chat",
        { message: input }
      );

      setmessage(prev => [
        ...prev,
        { text: response.data.reply, sender: "Ai" }
      ]);

    } catch (err) {
      console.log(err);
      setmessage(prev => [
        ...prev,
        { text: "Error from AI", sender: "Ai" }
      ]);
    }
    finally{
      Setloading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex items-center gap-3 bg-purple-600 text-white px-6 py-3 shadow-md">
        <img src={logo} className="w-10 h-11 rounded-full" />
        <h1 className="text-lg font-semibold">AI Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {message.map((mess, i) => (
          <div
            key={i}
            className={`flex ${
              mess.sender === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            
            
            <p
              className={`max-w-2xl px-5 py-3 rounded-2xl shadow-sm ${
                mess.sender === "Ai"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
          <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
  <ReactMarkdown>
    {mess.text}
  </ReactMarkdown>
</div>



            </p>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border px-5 py-3 rounded-2xl shadow-sm text-gray-600">
              AI typing...
            </div>
          </div>
        )}
        <div ref={ref}></div>
      </div>
      

      <div className="p-4 bg-white shadow-md flex gap-3">
  <input
    type="text"
    value={input}
    placeholder="Message AI Assistant..."
    className="flex-1 bg-white rounded-full px-6 py-3 outline-none shadow focus:ring-2 focus:ring-purple-500"
    onChange={(e) => setinput(e.target.value)}
  />

  <button
    onClick={handlebutton}
    className="bg-purple-600 text-white px-6 rounded-full hover:bg-purple-700 transition"
  >
    Send
  </button>
</div>

    </div>
  );
}
