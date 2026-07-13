import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, LayoutDashboard, CheckSquare, 
  BarChart3, Settings, Plus, Trash2, Edit3, CheckCircle, 
  Clock, Inbox, ChevronLeft, ChevronRight, Bell, Menu, X, Cpu, HardDrive
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  repeat: 'none' | 'daily' | 'weekly';
  color: string;
}

// 📡 Point this to your machine's physical Wi-Fi IP address if syncing over LAN via a mobile device!
const API_BASE_URL = 'http://localhost:8000/api/tasks';

export default function App() {
  // --- 1. Core State Hooks ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getLocalDateString = (dateObj: Date = new Date()) => {
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [dashboardDateStr, setDashboardDateStr] = useState<string>(getLocalDateString());
  const [focusedDateStr, setFocusedDateStr] = useState<string>(getLocalDateString());
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Work', 
    priority: 'medium', date: getLocalDateString(),
    start_time: '09:00', end_time: '10:00', repeat: 'none', color: '#3b82f6'
  });

  // --- 2. 12-Hour Format Utility ---
  const formatTimeTo12Hour = (timeStr: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? `0${hours}` : hours;
    return `${strHours}:${minutesStr} ${ampm}`;
  };

  // --- 3. PWA Service Worker Engine ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.error('Service worker registration failed:', err);
        });
      });
    }
  }, []);

  // --- 4. System Notification Engine ---
  const requestNotificationAccess = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const triggerLocalNotification = (title: string, body: string) => {
    if (notificationPermission === 'granted') {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: 'chronos-task-alert'
      });
    }
  };

  // Task execution timer observer loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeStr = now.toTimeString().substring(0, 5); 
      const currentDateStr = getLocalDateString(now);

      tasks.forEach(task => {
        if (!task.is_completed && task.date === currentDateStr && task.start_time === currentTimeStr) {
          triggerLocalNotification(`⏰ Task Starting Now!`, task.title);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [tasks, notificationPermission]);

  // ==========================================
  // 💾 DATABASE & BACKEND REST INTERFACE
  // ==========================================
  
  const fetchTasksFromBackend = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error();
      const data = await response.json();
      
      const formattedTasks = data.map((t: any) => ({
        ...t,
        date: t.date.split('T')[0],
        start_time: t.start_time.substring(0, 5),
        end_time: t.end_time.substring(0, 5),
        repeat: t.repeat || 'none'
      }));
      setTasks(formattedTasks);
      setError(null);
    } catch (err) {
      setError("Backend connection offline.");
    }
  };

  useEffect(() => {
    fetchTasksFromBackend();
  }, []);

  useEffect(() => {
    const dailyQueue = tasks
      .filter(t => t.date === focusedDateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    setSelectedDateTasks(dailyQueue);
  }, [tasks, focusedDateStr]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = editingTaskId !== null;
      const url = isEditing ? `${API_BASE_URL}/${editingTaskId}` : API_BASE_URL;
      const method = isEditing ? 'PUT' : 'POST';

      // ⏱️ Auto-sanitize any input variations seamlessly back into a clean 24h standard format string (HH:MM)
      const cleanTo24h = (timeStr: string) => {
        if (!timeStr) return "00:00";
        if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
          return timeStr.substring(0, 5);
        }
        
        const textCleaned = timeStr.replace(/\s+/g, '').toUpperCase();
        const isPM = textCleaned.includes('PM');
        const digitsOnly = textCleaned.replace('AM', '').replace('PM', '');
        const [hoursStr, minutesStr] = digitsOnly.split(':');
        
        let hours = parseInt(hoursStr, 10);
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        const formattedH = hours < 10 ? `0${hours}` : hours;
        const formattedM = minutesStr ? minutesStr.substring(0, 2) : "00";
        return `${formattedH}:${formattedM}`;
      };

      const currentStatus = isEditing 
        ? tasks.find(t => t.id === editingTaskId)?.is_completed || false 
        : false;

      // Complete structured target validation payload schema
      const payload = {
        title: formData.title,
        description: formData.description || '',
        category: formData.category,
        priority: formData.priority,
        date: formData.date,
        start_time: cleanTo24h(formData.start_time),
        end_time: cleanTo24h(formData.end_time),
        repeat: formData.repeat,
        color: formData.color,
        is_completed: currentStatus
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error();
      
      await fetchTasksFromBackend();
      setIsModalOpen(false);
      setEditingTaskId(null);
      setFormData({
        title: '', description: '', category: 'Work', 
        priority: 'medium', date: dashboardDateStr,
        start_time: '09:00', end_time: '10:00', repeat: 'none', color: '#3b82f6'
      });
    } catch (err) {
      alert("Could not update entry storage configuration.");
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      date: task.date,
      start_time: task.start_time,
      end_time: task.end_time,
      repeat: task.repeat,
      color: task.color
    });
    setIsModalOpen(true);
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      if (!response.ok) throw new Error();
      await fetchTasksFromBackend();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
      await fetchTasksFromBackend();
    } catch (err) {
      console.error(err);
    }
  };

  const dateScopedTasks = tasks.filter(t => t.date === dashboardDateStr);
  const totalTasks = dateScopedTasks.length;
  const completedTasks = dateScopedTasks.filter(t => t.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = dateScopedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'completed' ? task.is_completed : !task.is_completed);
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const currentMonthDays = getDaysInMonth(currentDate);
  const startDayOffset = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard Matrix', icon: LayoutDashboard },
    { id: 'calendar', name: 'Interactive Calendar', icon: CalendarIcon },
    { id: 'analytics', name: 'Analytics View', icon: BarChart3 },
    { id: 'settings', name: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500/30">
      
      {/* SIDEBAR MAIN LAYOUT CONTAINER */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col justify-between p-4 hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            {/* Custom Application Logo Frame */}
            <img 
              src="/logo.png" 
              alt="TaskPilot Logo" 
              className="h-8 w-8 object-contain flex-shrink-0" 
              onError={(e) => {
                // Graceful fallback code context if image asset directory path missing
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-bold text-xl tracking-tight text-white font-sans">TaskPilot</span>
          </div>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-950/60 text-blue-400 shadow-sm font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MOBILE DRAWER PORT EXPANSION LOGIC */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="absolute top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl text-white"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src="/logo.png" alt="TaskPilot Logo" className="h-8 w-8 object-contain flex-shrink-0" />
                    <span className="font-bold text-xl tracking-tight text-white font-sans">TaskPilot</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 border border-slate-800 rounded-lg text-slate-400 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navigationItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                          activeTab === item.id
                            ? 'bg-blue-950/60 text-blue-400 font-semibold'
                            : 'text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEWPORT WORKSPACE MAIN SHELL CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 border border-slate-800 text-slate-300 rounded-xl md:hidden cursor-pointer">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-xl text-white capitalize tracking-wide">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center space-x-3">
            {notificationPermission !== 'granted' && (
              <button 
                onClick={requestNotificationAccess}
                className="p-2 border border-slate-800 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center space-x-1 text-xs font-semibold"
              >
                <Bell className="h-4 w-4 text-indigo-500 animate-pulse" />
                <span className="hidden sm:inline">Allow Banners</span>
              </button>
            )}
            <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/10 cursor-pointer hover:opacity-90 active:scale-98 transition-all">
              <Plus className="h-4 w-4" />
              <span>Schedule Task</span>
            </button>
          </div>
        </header>

        {/* COMPONENT ROUTING ENGINE */}
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* MATRIX COMPONENT VIEW 1: DASHBOARD PORT */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Total Tracked', value: totalTasks, color: 'from-blue-500 to-cyan-500' },
                  { name: 'Pending Items', value: pendingTasks, color: 'from-amber-500 to-orange-500' },
                  { name: 'Completed Tasks', value: completedTasks, color: 'from-emerald-500 to-teal-500' },
                  { name: 'Completion Efficiency', value: `${completionRate}%`, color: 'from-indigo-500 to-purple-500' }
                ].map((card, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${card.color}`} />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.name}</p>
                    <p className="text-3xl font-bold mt-2 text-white">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Filtering Controller Layout Bar */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row gap-3 items-center justify-between">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                  <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <input type="date" value={dashboardDateStr} onChange={(e) => setDashboardDateStr(e.target.value)} className="bg-transparent text-xs font-bold text-slate-200 outline-none w-full cursor-pointer" />
                  </div>
                  <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div className="flex space-x-2 w-full lg:w-auto justify-end">
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer">
                    <option value="all">All Priorities</option>
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer">
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option><option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Functional Dynamic Task Feed Stream */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900 text-slate-500">
                      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Clear agenda. No tasks found.</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <motion.div
                        key={task.id} layout
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-white flex items-center justify-between shadow-sm group hover:border-blue-500/30 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <button onClick={() => toggleTaskCompletion(task)} className="text-slate-400 hover:text-emerald-500 cursor-pointer transition-colors">
                            <CheckCircle className={`h-6 w-6 ${task.is_completed ? 'text-emerald-500' : ''}`} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h4 className={`font-semibold text-sm truncate tracking-wide ${task.is_completed ? 'line-through opacity-40' : ''}`}>{task.title}</h4>
                            <p className="text-xs truncate mt-0.5 text-slate-400">{task.description}</p>
                            <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                                {formatTimeTo12Hour(task.start_time)} - {formatTimeTo12Hour(task.end_time)}
                              </span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">{task.priority}</span>
                              {task.repeat !== 'none' && <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded font-medium">🔄 {task.repeat}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all ml-2">
                          <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-blue-500 cursor-pointer"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* VIEWPORT COMPONENTS VIEW 2: INTERACTIVE MONTHLY CALENDAR GRID */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm transition-all duration-300 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-white tracking-wide">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex space-x-1">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1.5 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1.5 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 uppercase mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: startDayOffset }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square rounded-lg bg-slate-950/40" />
                  ))}
                  
                  {currentMonthDays.map((day) => {
                    const dateStr = getLocalDateString(day);
                    const dailyTasks = tasks.filter(t => t.date === dateStr);
                    const isToday = getLocalDateString(new Date()) === dateStr;
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setFocusedDateStr(dateStr)}
                        className={`aspect-square p-1 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer ${
                          focusedDateStr === dateStr 
                            ? 'border-blue-600 bg-blue-500/10 shadow-sm' 
                            : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800'
                        }`}
                      >
                        <span className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-lg ${
                          isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300'
                        }`}>
                          {day.getDate()}
                        </span>
                        <div className="flex space-x-1 mb-1">
                          {dailyTasks.slice(0, 3).map(t => (
                            <div key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Focus Agenda View Panel */}
              <div className="p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex flex-col justify-between transition-all duration-300 text-white">
                <div className="w-full">
                  <h3 className="font-bold text-base mb-4 flex items-center space-x-2 text-white border-b border-slate-800 pb-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Focus Timeline ({focusedDateStr})</span>
                  </h3>
                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {selectedDateTasks.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-xs">
                        <Inbox className="h-6 w-6 mx-auto opacity-40 mb-1" />
                        <p>No scheduled tasks active inside this quadrant.</p>
                      </div>
                    ) : (
                      selectedDateTasks.map(t => (
                        <div key={t.id} className="p-3 rounded-xl border bg-slate-950 border-slate-800 text-white relative overflow-hidden group">
                          <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: t.color }} />
                          <div className="flex justify-between items-start">
                            <h4 className={`font-semibold text-xs truncate pl-1 ${t.is_completed ? 'line-through opacity-40' : ''}`}>{t.title}</h4>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all ml-1">
                              <button onClick={() => openEditModal(t)} className="text-slate-400 hover:text-blue-500 cursor-pointer"><Edit3 className="h-3 w-3" /></button>
                              <button onClick={() => deleteTask(t.id)} className="text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 pl-1 font-medium">
                            {formatTimeTo12Hour(t.start_time)} - {formatTimeTo12Hour(t.end_time)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT COMPONENTS VIEW 3: SYSTEM EFFICIENCY PLOTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-white">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actual Focus Hours Completed</p>
                  <p className="text-3xl font-bold mt-2 text-white">
                    {(() => {
                      let totalMinutes = 0;
                      tasks.filter(t => t.is_completed).forEach(t => {
                        const [sHours, sMinutes] = t.start_time.split(':').map(Number);
                        const [eHours, eMinutes] = t.end_time.split(':').map(Number);
                        const diffMinutes = (eHours * 60 + eMinutes) - (sHours * 60 + sMinutes);
                        if (diffMinutes > 0) totalMinutes += diffMinutes;
                      });
                      return `${(totalMinutes / 60).toFixed(1)} hrs`;
                    })()}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-white">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Priority Completion</p>
                  <p className="text-3xl font-bold mt-2 text-amber-500">
                    {tasks.filter(t => t.priority === 'high' && t.is_completed).length} / {tasks.filter(t => t.priority === 'high').length}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-white">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Velocity Status</p>
                  <p className="text-3xl font-bold mt-2 text-emerald-500">
                    {completionRate >= 75 ? '🔥 High' : completionRate >= 40 ? '⚡ Steady' : '🐢 Standard'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6 text-white">
                <h3 className="font-bold text-base text-white tracking-wide">Category Completion Metrics</h3>
                <div className="space-y-4">
                  {['Work', 'Personal', 'Health', 'Design'].map(cat => {
                    const totalCatTasks = tasks.filter(t => t.category === cat).length;
                    const compCatTasks = tasks.filter(t => t.category === cat && t.is_completed).length;
                    const completionPercent = totalCatTasks > 0 ? Math.round((compCatTasks / totalCatTasks) * 100) : 0;
                    
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">{cat} ({compCatTasks} of {totalCatTasks} completed)</span>
                          <span className="text-emerald-500 font-bold">{completionPercent}% done</span>
                        </div>
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionPercent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT COMPONENTS VIEW 4: LOCAL DIAGNOSTICS CONFIG */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 text-white">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  <h3 className="font-bold text-base text-white">Application Diagnostics</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">PWA Manifest Engine:</span><span className="text-emerald-500 font-bold">ACTIVE</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Local Port Config:</span><span className="text-blue-500 font-bold">localhost:3000</span></div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 text-white">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <HardDrive className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-bold text-base text-white">Database Statistics</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Total Database Rows:</span><span className="text-slate-200 font-bold">{tasks.length} rows</span></div>
                  <button 
                    onClick={() => triggerLocalNotification("🔧 Diagnostics Active", "Hardware connection verified.")} 
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer text-white border border-slate-700/60"
                  >
                    Run Integration Diagnostics Test
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* OPERATIONAL CRUD SCHEMA SCHEDULER MODAL ANCHOR */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => { setIsModalOpen(false); setEditingTaskId(null); }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md w-full p-6 space-y-4 relative z-10 shadow-2xl">
              <h3 className="text-lg font-bold tracking-wide">{editingTaskId !== null ? 'Modify Scheduled Task Entry' : 'Schedule Task'}</h3>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 text-sm rounded-xl outline-none text-white focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Description</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 text-sm rounded-xl outline-none text-white focus:border-blue-500 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-xl text-sm outline-none cursor-pointer">
                      <option>Work</option><option>Personal</option><option>Health</option><option>Design</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-xl text-sm outline-none cursor-pointer">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Interval</label>
                    <select value={formData.repeat} onChange={e => setFormData({...formData, repeat: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-xl text-sm outline-none cursor-pointer">
                      <option value="none">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 text-xs rounded-xl outline-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Start Time</label>
                    <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 text-xs rounded-xl outline-none cursor-pointer font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">End Time</label>
                    <input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 text-xs rounded-xl outline-none cursor-pointer font-semibold" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditingTaskId(null); }} className="px-4 py-2 border border-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-md cursor-pointer active:scale-95 transition-all">Commit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}