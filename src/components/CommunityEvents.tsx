import React, { useState } from "react";
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Award,
  BookOpen,
  Newspaper,
  Megaphone,
  User,
  Tag,
  Search,
  BellRing,
  X,
  Share2
} from "lucide-react";
import { CommunityEvent } from "../types";
import Pagination from "./Pagination";

interface CommunityEventsProps {
  events: CommunityEvent[];
  onAddEvent: (newEvent: CommunityEvent) => void;
  onUpdateEventStatus: (id: string, status: CommunityEvent["status"]) => void;
}

interface LocalNews {
  id: string;
  title: string;
  category: "Thông báo khẩn" | "Hành chính" | "Y tế & Đời sống" | "Phong trào" | "An sinh xã hội";
  date: string;
  author: string;
  content: string;
  isPinned?: boolean;
}

export default function CommunityEvents({ events, onAddEvent, onUpdateEventStatus }: CommunityEventsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"news" | "events">("news");
  
  // Pagination states
  const [currentNewsPage, setCurrentNewsPage] = useState(1);
  const [currentEventsPage, setCurrentEventsPage] = useState(1);
  const newsPerPage = 4;
  const eventsPerPage = 6;

  const handleNewsSearchChange = (val: string) => {
    setNewsSearch(val);
    setCurrentNewsPage(1);
  };

  const handleNewsFilterChange = (val: string) => {
    setNewsFilter(val);
    setCurrentNewsPage(1);
  };

  const handleEventFilterChange = (val: "Tất cả" | "Sắp diễn ra" | "Đang diễn ra" | "Đã kết thúc") => {
    setEventFilter(val);
    setCurrentEventsPage(1);
  };

  // States for Events Calendar
  const [showEventModal, setShowEventModal] = useState(false);
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("Ban Điều hành Khu phố 3");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("Nhà Văn hóa Khu phố 3");
  const [expectedAttendees, setExpectedAttendees] = useState(50);
  const [description, setDescription] = useState("");
  const [eventFilter, setEventFilter] = useState<"Tất cả" | "Sắp diễn ra" | "Đang diễn ra" | "Đã kết thúc">("Tất cả");

  // States for News Board
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsSearch, setNewsSearch] = useState("");
  const [newsFilter, setNewsFilter] = useState<string>("Tất cả");
  const [newsList, setNewsList] = useState<LocalNews[]>([]);

  // States for new News Item
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsCategory, setNewNewsCategory] = useState<LocalNews["category"]>("Hành chính");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [newNewsAuthor, setNewNewsAuthor] = useState("Ban Điều hành Khu phố 3");

  const handleCreateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle || !newNewsContent) {
      alert("Vui lòng điền đầy đủ tiêu đề và nội dung bản tin!");
      return;
    }

    const todayStr = new Date().toLocaleDateString("vi-VN");
    const newNews: LocalNews = {
      id: "NEWS" + (newsList.length + 1).toString().padStart(3, "0"),
      title: newNewsTitle,
      category: newNewsCategory,
      date: todayStr,
      author: newNewsAuthor,
      content: newNewsContent,
      isPinned: false
    };

    setNewsList([newNews, ...newsList]);
    setShowNewsModal(false);
    
    // Reset news form
    setNewNewsTitle("");
    setNewNewsContent("");
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateTime || !description) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    const newEvent: CommunityEvent = {
      id: "EV" + (events.length + 1).toString().padStart(3, "0"),
      title,
      organizer,
      dateTime,
      location,
      status: "Sắp diễn ra",
      expectedAttendees: Number(expectedAttendees) || 50,
      description
    };

    onAddEvent(newEvent);
    setShowEventModal(false);

    // Reset event form
    setTitle("");
    setDateTime("");
    setExpectedAttendees(50);
    setDescription("");
  };

  // Filters
  const filteredEvents = events.filter(ev => {
    if (eventFilter === "Tất cả") return true;
    return ev.status === eventFilter;
  });

  const filteredNews = newsList.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(newsSearch.toLowerCase()) || 
                          news.content.toLowerCase().includes(newsSearch.toLowerCase());
    const matchesCategory = newsFilter === "Tất cả" || news.category === newsFilter;
    return matchesSearch && matchesCategory;
  });

  // News Pagination Logic
  const totalNewsItems = filteredNews.length;
  const totalNewsPages = Math.ceil(totalNewsItems / newsPerPage) || 1;
  const activeNewsPage = currentNewsPage > totalNewsPages ? totalNewsPages : currentNewsPage;
  const startNewsIndex = (activeNewsPage - 1) * newsPerPage;
  const paginatedNews = filteredNews.slice(startNewsIndex, startNewsIndex + newsPerPage);

  // Events Pagination Logic
  const totalEventsItems = filteredEvents.length;
  const totalEventsPages = Math.ceil(totalEventsItems / eventsPerPage) || 1;
  const activeEventsPage = currentEventsPage > totalEventsPages ? totalEventsPages : currentEventsPage;
  const startEventsIndex = (activeEventsPage - 1) * eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startEventsIndex, startEventsIndex + eventsPerPage);

  return (
    <div id="news-and-events-view" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner Header with Sub-tabs */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-teal-500 font-bold px-2.5 py-0.5 rounded font-mono uppercase tracking-widest text-teal-100">Bản tin & Chương trình phong trào</span>
          <h1 className="text-xl font-bold tracking-tight">Kênh Tin tức & Quản lý Sự kiện Khu phố</h1>
          <p className="text-teal-200 text-xs">Cập nhật chỉ thị, thông báo hành chính, y tế khẩn cấp và theo dõi lịch sinh hoạt công cộng tại Khu phố 3</p>
        </div>
        
        {/* Buttons to Trigger Modals */}
        <div className="flex gap-2.5 shrink-0 w-full sm:w-auto">
          {activeSubTab === "news" ? (
            <button 
              onClick={() => setShowNewsModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer border border-teal-400/20"
            >
              <Megaphone size={14} /> Đăng Thông báo mới
            </button>
          ) : (
            <button 
              onClick={() => setShowEventModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              <Plus size={16} /> Đăng ký Sự kiện & Đặt chỗ
            </button>
          )}
        </div>
      </div>

      {/* Switcher Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveSubTab("news")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer
            ${activeSubTab === "news" ? "text-teal-600 font-extrabold" : "text-slate-400 hover:text-slate-600"}
          `}
        >
          <Newspaper size={18} /> Bản tin & Thông báo Khu phố
          {activeSubTab === "news" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("events")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer
            ${activeSubTab === "events" ? "text-teal-600 font-extrabold" : "text-slate-400 hover:text-slate-600"}
          `}
        >
          <CalendarDays size={18} /> Lịch sinh hoạt & Sự kiện Nhà Văn hóa
          {activeSubTab === "events" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
          )}
        </button>
      </div>

      {/* RENDER TAB 1: NEWS & ANNOUNCEMENTS */}
      {activeSubTab === "news" && (
        <div className="space-y-6">
          {/* News Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm bản tin, thông báo hành chính, lịch tiêm ngừa..."
                value={newsSearch}
                onChange={(e) => handleNewsSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
              />
            </div>
            
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              {["Tất cả", "Thông báo khẩn", "Hành chính", "Y tế & Đời sống", "An sinh xã hội", "Phong trào"].map(cat => (
                <button
                  key={cat}
                  onClick={() => handleNewsFilterChange(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${newsFilter === cat ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* News Pinned Highlight Panel */}
          {newsFilter === "Tất cả" && newsSearch === "" && newsList.some(n => n.isPinned) && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                <BellRing size={12} className="animate-bounce" /> Thông báo quan trọng cần lưu ý
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsList.filter(n => n.isPinned).map(news => (
                  <div key={news.id} className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl relative shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {news.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{news.date}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mt-3 leading-snug">{news.title}</h3>
                    <p className="text-slate-600 text-xs mt-2 line-clamp-3 leading-relaxed">{news.content}</p>
                    <div className="mt-4 pt-3 border-t border-rose-100/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-medium flex items-center gap-1"><User size={10} /> Đăng bởi: {news.author}</span>
                      <button 
                        onClick={() => alert(`Chi tiết bản tin:\n\nTiêu đề: ${news.title}\n\nNội dung: ${news.content}\n\nTác giả: ${news.author}`)}
                        className="text-teal-600 hover:underline font-bold"
                      >
                        Đọc toàn văn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular News List */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tất cả bản tin cập nhật ({filteredNews.length})</span>
            {filteredNews.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 border border-slate-100 rounded-2xl shadow-sm">
                Không tìm thấy bản tin nào phù hợp với bộ lọc tìm kiếm.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedNews.map(news => (
                  <div key={news.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                          news.category === "Thông báo khẩn" ? "bg-red-50 text-red-600" :
                          news.category === "Hành chính" ? "bg-blue-50 text-blue-600" :
                          news.category === "Y tế & Đời sống" ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-600"
                        }`}>
                          {news.category}
                        </span>
                        <span className="text-slate-400 font-mono">{news.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{news.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{news.content}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                      <span className="truncate max-w-[180px]">Nguồn: {news.author}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => alert(`Chi tiết bản tin:\n\nTiêu đề: ${news.title}\n\nNội dung: ${news.content}\n\nTác giả: ${news.author}`)}
                          className="text-teal-600 font-bold hover:underline"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination
              id="news-pagination"
              currentPage={activeNewsPage}
              totalItems={totalNewsItems}
              itemsPerPage={newsPerPage}
              onPageChange={setCurrentNewsPage}
            />
          </div>
        </div>
      )}

      {/* RENDER TAB 2: EVENTS CALENDAR */}
      {activeSubTab === "events" && (
        <div className="space-y-6">
          
          {/* Quick Info Grid for Events */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-tr from-teal-600 to-teal-800 text-white p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-xl bg-white/10"><CalendarDays size={22} /></div>
                <span className="text-[10px] bg-white/20 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">Sử dụng trụ sở</span>
              </div>
              <div>
                <span className="text-teal-100 text-[10px] font-bold uppercase tracking-wider block">Phòng hội họp Nhà Văn hóa</span>
                <h3 className="text-base font-bold">Trụ sở sinh hoạt Khu phố 3</h3>
                <p className="text-[11px] text-teal-100/80 mt-1 leading-relaxed">Luôn mở cửa phục vụ các chi hội đoàn thể họp định kỳ và tổ chức sinh hoạt kỹ năng cho con em hẻm nội khu.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700"><Users size={22} /></div>
                <span className="text-xs text-emerald-600 font-extrabold font-mono bg-emerald-50 px-2.5 py-0.5 rounded">Tích cực</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Thống kê Sự kiện Năm nay</span>
                <h3 className="text-lg font-bold text-slate-800">{events.length} hoạt động phong trào</h3>
                <p className="text-[11px] text-slate-500 mt-1">Nỗ lực đạt 100% chỉ tiêu phong trào văn nghệ và phong trào dân vận khéo phường giao phó.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><Award size={22} /></div>
                <span className="text-xs text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded">Văn hóa</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Chuẩn mực lối sống</span>
                <h3 className="text-base font-bold text-slate-800">Gia đình Văn hóa xuất sắc</h3>
                <p className="text-[11px] text-slate-500 mt-1">Đạt tỷ lệ cao các hộ dân đăng ký thi đua lối sống văn minh đô thị.</p>
              </div>
            </div>
          </div>

          {/* Event Filters */}
          <div className="flex border-b border-slate-100 gap-6">
            {(["Tất cả", "Sắp diễn ra", "Đang diễn ra", "Đã kết thúc"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleEventFilterChange(tab)}
                className={`pb-3 text-xs font-semibold transition-all relative cursor-pointer
                  ${eventFilter === tab ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"}
                `}
              >
                {tab}
                {eventFilter === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-12 text-center text-xs text-slate-400">
                Không tìm thấy sự kiện hay hoạt động đoàn thể nào tương ứng bộ lọc.
              </div>
            ) : (
              paginatedEvents.map((ev) => {
                const statusConfigs = {
                  "Sắp diễn ra": { text: "Sắp diễn ra", color: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
                  "Đang diễn ra": { text: "Đang diễn ra", color: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse", icon: Sparkles },
                  "Đã kết thúc": { text: "Đã hoàn thành", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
                  "Đã hủy": { text: "Đã hủy", color: "bg-rose-50 text-rose-500 border-rose-100", icon: AlertTriangle }
                };

                const conf = statusConfigs[ev.status];
                const StatusIcon = conf.icon;

                return (
                  <div 
                    key={ev.id}
                    id={`event-card-${ev.id}`}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">{ev.id}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 ${conf.color}`}>
                          <StatusIcon size={12} /> {conf.text}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{ev.title}</h3>
                      <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">{ev.description}</p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-50 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays size={14} className="text-slate-400 shrink-0" />
                        <span className="font-medium font-mono text-[11px]">{ev.dateTime}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-400 pt-1">
                        <span className="text-[10px] font-semibold truncate max-w-[130px]">Tổ chức: {ev.organizer}</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users size={10} /> {ev.expectedAttendees} người
                        </span>
                      </div>
                    </div>

                    {/* Operations */}
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      {ev.status === "Sắp diễn ra" && (
                        <>
                          <button
                            onClick={() => onUpdateEventStatus(ev.id, "Đang diễn ra")}
                            className="flex-1 text-[10px] font-extrabold py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg transition-colors cursor-pointer text-center"
                          >
                            Bắt đầu ngay
                          </button>
                          <button
                            onClick={() => onUpdateEventStatus(ev.id, "Đã kết thúc")}
                            className="flex-1 text-[10px] font-extrabold py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg transition-colors cursor-pointer text-center"
                          >
                            Hoàn tất sớm
                          </button>
                        </>
                      )}
                      {ev.status === "Đang diễn ra" && (
                        <button
                          onClick={() => onUpdateEventStatus(ev.id, "Đã kết thúc")}
                          className="w-full text-[10px] font-extrabold py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer text-center"
                        >
                          Xác nhận Đã tổ chức xong
                        </button>
                      )}
                      {ev.status === "Đã kết thúc" && (
                        <div className="w-full text-[10px] text-slate-400 text-center font-semibold py-1">
                          ✓ Đã lưu trữ hồ sơ hoạt động
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Pagination
            id="events-pagination"
            currentPage={activeEventsPage}
            totalItems={totalEventsItems}
            itemsPerPage={eventsPerPage}
            onPageChange={setCurrentEventsPage}
          />
        </div>
      )}

      {/* MODAL 1: ADD NEWS */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Đăng tin tức & Thông báo mới</h3>
                <p className="text-[10px] text-slate-300">Phát sóng thông cáo chính trị, hành chính, đời sống dân cư</p>
              </div>
              <button 
                onClick={() => setShowNewsModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateNews} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Tiêu đề Bản tin *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Kế hoạch cắt điện luân phiên, Lịch tiêm chủng mở rộng tháng này..."
                  value={newNewsTitle}
                  onChange={(e) => setNewNewsTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Chuyên mục Bản tin</label>
                  <select
                    value={newNewsCategory}
                    onChange={(e) => setNewNewsCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Hành chính">Hành chính</option>
                    <option value="Thông báo khẩn">Thông báo khẩn</option>
                    <option value="Y tế & Đời sống">Y tế & Đời sống</option>
                    <option value="Phong trào">Phong trào</option>
                    <option value="An sinh xã hội">An sinh xã hội</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Nguồn phát tin / Tác giả</label>
                  <input 
                    type="text"
                    required
                    value={newNewsAuthor}
                    onChange={(e) => setNewNewsAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nội dung chi tiết *</label>
                <textarea 
                  rows={5}
                  required
                  placeholder="Nhập nội dung thông báo đầy đủ gửi tới cư dân hẻm..."
                  value={newNewsContent}
                  onChange={(e) => setNewNewsContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowNewsModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-semibold"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Phát tin ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD EVENT / BOOKING */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Lên lịch hoạt động & Đặt chỗ sử dụng Nhà văn hóa</h3>
              <button 
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddEventSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Tên sự kiện / Mục đích họp dân *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Họp chi bộ định kỳ tháng 8, Lớp sinh hoạt kỹ năng hè..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Đơn vị chủ trì *</label>
                  <input 
                    type="text" 
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Dự kiến số người tham dự *</label>
                  <input 
                    type="number" 
                    required
                    value={expectedAttendees}
                    onChange={(e) => setExpectedAttendees(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Thời gian tổ chức *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: 25/07/2026 - 19:00"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Địa điểm mượn *</label>
                  <input 
                    type="text" 
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Nội dung chi tiết chương trình *</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Ghi rõ chương trình nghị sự, mục đích, cơ sở vật chất cần mượn (Ví dụ: loa kéo, bàn ghế, tivi trình chiếu...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Guidelines warning banner */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-[11px] text-amber-800 flex gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                <p><strong>Lưu ý sử dụng Trụ sở:</strong> Các tổ chức có trách nhiệm vệ sinh sạch sẽ, tắt toàn bộ điều hòa/thiết bị điện trước khi bàn giao lại chìa khóa cho Tổ quản lý Nhà văn hóa.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Đăng ký Đặt chỗ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
