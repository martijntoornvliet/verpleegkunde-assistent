import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, User, Bot, Info, Sparkles, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { chatWithGemini } from "./services/gemini";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Dag! Ik help je graag met al je vragen over je studie bij Verpleegkunde. Waar kan ik je vandaag bij ondersteunen? Denk aan vragen over je studieduur of mogelijke vrijstellingen.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const downloadChat = () => {
    const chatText = messages.map(m => {
      const role = m.role === "user" ? "Student" : "HU Assistent";
      const time = m.timestamp.toLocaleString();
      return `[${time}] ${role}:\n${m.text}\n${"-".repeat(20)}`;
    }).join("\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HU-Verpleegkunde-Chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));
      chatHistory.push({ role: "user", text: input });

      const response = await chatWithGemini(chatHistory);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#004691] text-white p-6 flex flex-col gap-8 hidden md:flex">
        <div className="border-b border-white/20 pb-4">
          <h1 className="text-xl font-bold tracking-tight">HU Assistent</h1>
          <p className="text-xs opacity-80 mt-1">Bachelor Verpleegkunde</p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] uppercase tracking-widest text-[#FFD200] font-bold">Brondocumenten</h2>
          <ul className="flex flex-col gap-2">
            {[
              "OER Verpleegkunde 2023-2024",
              "Studiegids Jaar 2",
              "Handboek Vrijstellingen (HU)",
              "Eindkwalificaties BN2020"
            ].map((source) => (
              <li key={source} className="text-[13px] p-2 bg-white/5 rounded-md flex items-center gap-2">
                <BookOpen size={14} className="opacity-60" />
                {source}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto">
          <p className="text-[10px] opacity-60">Ingelogd als: Student 492011</p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white relative">
        <header className="px-8 py-5 border-b border-[#E5E7EB] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full"></div>
            <span className="font-semibold text-[15px]">Studieadvies Chat</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={downloadChat}
              className="text-[#004691] hover:bg-[#EBF4FF] gap-2 text-xs font-semibold"
            >
              <Download size={14} />
              Gesprek opslaan
            </Button>
            <span className="text-[13px] text-[#6B7280] hidden sm:inline">Vragen over studieroute & vrijstellingen</span>
          </div>
        </header>

        <div className="flex-1 bg-[#FAFAFA] overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-8" ref={scrollRef}>
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] p-4 rounded-xl text-[15px] leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "bg-[#004691] text-white self-end rounded-br-none"
                        : "bg-white text-[#1F2937] self-start rounded-bl-none border-l-4 border-[#004691] shadow-md"
                    }`}
                  >
                    {message.text.split('\n').map((line, i) => (
                      <p key={i} className={line.trim() === "" ? "h-2" : ""}>{line}</p>
                    ))}
                    {message.role === "model" && message.text.includes("?") && (
                      <span className="block mt-2 italic font-medium text-[#004691]">
                        Vraag om meer details als je antwoord te algemeen is.
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border-l-4 border-[#004691] p-4 rounded-xl self-start flex gap-1 items-center shadow-md"
                >
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-[#E5E7EB] bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Input
                placeholder="Stel je vraag over vrijstellingen, studieduur of je studieroute..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 py-6 px-5 bg-[#F9FAFB] border-[#E5E7EB] rounded-lg text-[15px] focus-visible:ring-[#004691]"
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[#004691] hover:bg-[#003A75] px-8 h-auto rounded-lg font-semibold text-[15px] transition-all"
              >
                Verstuur
              </Button>
            </div>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                "Vrijstelling aanvragen",
                "Studieduur verkorten",
                "Welke bronnen gebruik je?"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-[11px] font-semibold text-[#004691] bg-[#EBF4FF] px-3 py-1 rounded-full hover:bg-[#D1E4FF] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
