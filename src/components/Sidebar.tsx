import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Briefcase, 
  Map, 
  Bot, 
  MessageSquare, 
  ShieldAlert, 
  Menu, 
  X,
  User,
  Settings,
  Heart,
  CalendarDays,
  Coins,
  FileText,
  LogOut,
  Activity
} from "lucide-react";
import { ActiveTab } from "../types";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: {
    fullName: string;
    role: "canbo" | "nguoidan";
  } | null;
  onLogout: () => void;
  residentPermissions: Record<string, boolean>;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  residentPermissions 
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Auto collapse on screens smaller than 1024px (desktop)
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    handleResize(); // Init on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "residents", label: "Quản lý Dân cư", icon: Users },
    { id: "households", label: "Quản lý Hộ khẩu", icon: Home },
    { id: "businesses", label: "Cơ sở Kinh doanh", icon: Briefcase },
    { id: "gis", label: "Bản đồ GIS", icon: Map },
    { id: "ai", label: "Trợ lý AI", icon: Bot },
    { id: "reports", label: "Phản ánh hiện trường", icon: MessageSquare },
    { id: "party", label: "Quản lý Chi hội", icon: ShieldAlert },
    { id: "welfare", label: "An sinh Xã hội", icon: Heart },
    { id: "cultural", label: "Tin tức & Sự kiện", icon: CalendarDays },
    { id: "finance", label: "Quỹ Khu phố", icon: Coins },
    ...(currentUser?.role === "canbo" ? [{ id: "settings", label: "Cấu hình & Duyệt", icon: Settings }, { id: "health", label: "Trạng thái Hệ thống", icon: Activity }] : [])
  ];

  // Filter items based on user role and permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === "canbo") return true;
    
    // For resident ("nguoidan"):
    // Check if the tab is allowed in residentPermissions
    return residentPermissions[item.id] ?? false;
  });

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-emerald-600 text-white rounded-lg md:hidden hover:bg-emerald-700 transition-colors shadow-lg cursor-pointer"
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs transition-opacity duration-200"
          id="sidebar-backdrop"
        />
      )}

      {/* Sidebar Container */}
      <div 
        id="sidebar-container"
        className={`fixed top-0 left-0 h-screen bg-slate-900 text-slate-100 flex flex-col z-40 transition-all duration-300 border-r border-slate-800
          ${isOpen ? "w-64" : "w-20 md:w-20"} 
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* App Logo & Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800 h-16 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20 shrink-0">
            KP3
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold tracking-tight text-white truncate text-base">AN PHÚ</span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-semibold uppercase">KHU PHỐ THÔNG MINH</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  // Auto-close on mobile
                  if (window.innerWidth < 768) {
                    setIsOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer group relative
                  ${isActive 
                    ? "bg-emerald-600/20 text-emerald-400 border-l-4 border-emerald-500 font-semibold" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }
                `}
              >
                <IconComponent 
                  size={20} 
                  className={`shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-100"}`} 
                />
                
                {isOpen && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Tooltip on compact mode */}
                {!isOpen && (
                  <span className="absolute left-16 bg-slate-950 text-white text-xs rounded px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout at Bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                id="sidebar-user-avatar"
                src={currentUser?.role === "canbo" 
                  ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                  : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                } 
                alt="Avatar" 
                className="w-9 h-9 rounded-full border border-slate-700 object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              {isOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">{currentUser?.fullName || "Chưa đăng nhập"}</span>
                  <span className="text-[10px] text-slate-500 truncate font-mono">
                    {currentUser?.role === "canbo" ? "Bí thư Chi bộ KP3" : "Cư dân KP3"}
                  </span>
                </div>
              )}
            </div>
            
            {isOpen && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all shrink-0 cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          
          {!isOpen && (
            <button
              onClick={onLogout}
              className="w-full py-2.5 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
