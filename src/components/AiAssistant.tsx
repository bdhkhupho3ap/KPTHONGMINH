import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  HelpCircle,
  AlertCircle,
  Volume2,
  Bookmark
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Xin chào! Tôi là Trợ lý Ảo Thông Minh của Ban quản lý Khu phố 3, Phường An Phú. Tôi có thể hỗ trợ cư dân và cán bộ tra cứu nhanh thủ tục hành chính, lịch sinh hoạt khu phố, thông tin liên hệ khẩn cấp hoặc phân loại phản ánh hiện trường. Bạn cần tôi trợ giúp điều gì hôm nay?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    "Thủ tục đăng ký tạm trú tại khu phố?",
    "Ai là Bí thư chi bộ và SĐT liên hệ?",
    "Làm cách nào gửi phản ánh rác thải?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("Mất kết nối với máy chủ AI");
      }

      const data = await response.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.content }]);
    } catch (error: any) {
      console.error(error);
      setMessages([...updatedMessages, { 
        role: "assistant", 
        content: `❌ Không thể kết nối với Trợ lý AI: ${error.message}. Vui lòng thử lại sau hoặc liên hệ Văn phòng Khu phố.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render markdown helper (bold, lists, paragraphs)
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let content = line;
      // Bold rendering
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const renderedLine = parts.length > 0 ? parts : content;

      if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
        return <div key={idx} className="pl-4 py-0.5 text-slate-300 font-sans text-sm">{renderedLine}</div>;
      }
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        // Strip the dash/asterisk
        const cleaned = line.replace(/^[\s-*]+/, "");
        return (
          <div key={idx} className="flex gap-2 pl-6 py-0.5 text-slate-300 font-sans text-sm">
            <span className="text-emerald-400">•</span>
            <span>{cleaned}</span>
          </div>
        );
      }
      return <p key={idx} className="py-1 text-slate-300 leading-relaxed font-sans text-sm">{renderedLine}</p>;
    });
  };

  return (
    <div id="ai-assistant-view" className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-sans">Trợ lý Cư dân Trí tuệ Nhân tạo (Gemini AI)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Tra cứu chính xác thủ tục hành chính địa phương, điều lệ quy chế và danh bạ hỗ trợ khẩn cấp</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg">
          <Sparkles size={14} className="text-indigo-600 animate-pulse" />
          <span>Vận hành bởi Gemini 3.5 Flash</span>
        </div>
      </div>

      {/* Main chat UI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Chat message threads */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
          
          {/* Chat box header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Bot size={18} />
              </div>
              <div>
                <span className="font-bold text-sm text-white block leading-none">AI Trợ lý Khu phố 3</span>
                <span className="text-[10px] text-slate-500 font-mono">Đang trực tuyến • Sẵn sàng hỗ trợ</span>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (confirm("Xóa lịch sử cuộc trò chuyện hiện tại?")) {
                  setMessages([{ role: "assistant", content: "Lịch sử trò chuyện đã được làm sạch. Tôi có thể hỗ trợ gì thêm cho bạn?" }]);
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded transition-all cursor-pointer"
            >
              Xóa lịch sử
            </button>
          </div>

          {/* Messages list container */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/20">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div 
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`p-2.5 rounded-full shrink-0 flex items-center justify-center self-end w-8 h-8 border
                    ${isUser 
                      ? "bg-slate-800 border-slate-700 text-slate-300" 
                      : "bg-emerald-600/15 border-emerald-500/20 text-emerald-400"
                    }
                  `}>
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  <div className={`p-4 rounded-2xl border text-sm shadow-md leading-relaxed
                    ${isUser 
                      ? "bg-emerald-600 border-emerald-500 text-white rounded-br-none" 
                      : "bg-slate-900 border-slate-800 text-slate-300 rounded-bl-none"
                    }
                  `}>
                    {isUser ? (
                      <p className="font-sans text-sm">{m.content}</p>
                    ) : (
                      <div className="space-y-1">
                        {renderFormattedText(m.content)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto items-end">
                <div className="p-2.5 rounded-full shrink-0 bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center w-8 h-8">
                  <Bot size={14} className="animate-spin" />
                </div>
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 rounded-bl-none text-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  <span className="ml-1 font-medium font-sans">Trợ lý AI đang soạn câu trả lời...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input and submit */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2.5"
            >
              <input 
                type="text" 
                placeholder="Nhập câu hỏi của bạn tại đây (ví dụ: Làm sao đăng ký tạm trú)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Right FAQ panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <HelpCircle size={16} className="text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Gợi ý Câu Hỏi Thường Gặp</h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  id={`faq-${i}`}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-emerald-500/30 transition-all text-xs font-semibold text-slate-700 leading-relaxed cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-900">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-950">Chế độ đồng bộ Dân cư</span>
              <span>Trợ lý AI được tích hợp trực tiếp dữ liệu nhân tịch nội bộ. Mọi thông tin phản hồi đều tuân thủ chặt chẽ theo Luật Cư Trú mới nhất.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
