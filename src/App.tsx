/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Pill, Wallet, ChevronLeft, ChevronRight, 
  RotateCcw, Calendar, MessageSquare, Send, X, Bot, 
  Loader2, Home, BarChart3, Info, Mail, Shield, Menu, 
  Search, Edit3, TrendingUp, Users, Activity, Moon, Sun, Sparkles,
  LayoutDashboard, HeartPulse, CheckCircle2, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';

// --- Interfaces ---
interface Medication {
  id: string;
  name: string;
  price: string;
}

interface DailyRecord {
  date: string;
  meds: Medication[];
  total: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type View = 'home' | 'pharmacy' | 'ai' | 'reports' | 'about' | 'contact' | 'privacy';

// --- Main Application ---
export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<View>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Pharmacy State
  const [meds, setMeds] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('current_day_meds');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<DailyRecord[]>(() => {
    const saved = localStorage.getItem('pharmacy_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewIndex, setViewIndex] = useState(-1);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [
      { id: '1', role: 'assistant', content: 'مرحباً بك في المساعد الذكي! أنا هنا لمساعدتك في استفسارات الأدوية، الجرعات، والتعارضات الدوائية. كيف يمكنني خدمتك اليوم؟' }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Persist State
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('current_day_meds', JSON.stringify(meds));
  }, [meds]);

  useEffect(() => {
    localStorage.setItem('pharmacy_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping, currentView]);

  // --- Helpers ---
  const calculateTotal = (items: Medication[]) => {
    return items.reduce((sum, item) => sum + parseFloat(item.price || '0'), 0);
  };

  const addMed = () => {
    if (!name.trim()) {
      setErrorToast('يرجى إدخال اسم الدواء');
      return;
    }
    const normalizedPrice = price.replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
                                .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString());

    if (!normalizedPrice || isNaN(parseFloat(normalizedPrice))) {
      setErrorToast('يرجى إدخال سعر صحيح');
      return;
    }
    const newMed: Medication = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      price: parseFloat(normalizedPrice).toFixed(2),
    };
    setMeds([newMed, ...meds]);
    setName('');
    setPrice('');
  };

  const confirmStartNewDay = () => {
    if (meds.length === 0) {
      setErrorToast('لا يمكن بدء يوم جديد بدون مبيعات');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeStartNewDay = () => {
    const newRecord: DailyRecord = {
      date: new Date().toLocaleDateString('ar-EG', { 
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
      }),
      meds: [...meds],
      total: calculateTotal(meds),
    };
    setHistory([newRecord, ...history]);
    setMeds([]);
    setShowConfirmModal(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      const aiMsg: ChatMessage = { id: Date.now().toString(), role: 'assistant', content: data.content };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setErrorToast("خطأ في الاتصال بالمساعد الذكي");
      setChatMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'عذراً، حدث خطأ. حاول مجدداً.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentDisplayMeds = viewIndex === -1 ? meds : history[viewIndex].meds;
  const filteredMeds = currentDisplayMeds.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Views ---

  const HeroSection = () => (
    <div className="w-full flex flex-col items-center gap-12 py-16 px-6">
      <div className="max-w-4xl text-center space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black text-text-main leading-tight"
        >
          أدر صيدليتك <span className="text-primary italic">بذكاء ونظام</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-text-muted max-w-2xl mx-auto"
        >
          نظام متكامل لإدارة المبيعات اليومية، تتبع الأرباح، والاستعانة بالذكاء الاصطناعي لتطوير خدماتك الصيدلانية.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <button 
            onClick={() => setCurrentView('pharmacy')}
            className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            ادخل للنظام <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => setCurrentView('about')}
            className="px-8 py-4 bg-bg-card border-2 border-border text-text-main rounded-2xl font-bold text-lg hover:border-primary transition-all transform hover:scale-105 active:scale-95"
          >
            تعرف علينا
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {[
          { icon: <LayoutDashboard size={32} />, title: "إدارة المبيعات", desc: "تسجيل المبيعات اليومية بدقة وسهولة متناهية." },
          { icon: <Bot size={32} />, title: "مساعد ذكي", desc: "ذكاء اصطناعي متخصص للإجابة على استفساراتك الطبية." },
          { icon: <TrendingUp size={32} />, title: "إحصائيات دقيقة", desc: "تقارير ورسوم بيانية توضح أداء صيدليتك يومياً." },
        ].map((f, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="p-8 bg-bg-card border border-border rounded-[32px] shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
            <p className="text-text-muted leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-6xl h-32 bg-slate-100 dark:bg-slate-800/50 rounded-[32px] border-2 border-dashed border-border flex items-center justify-center text-text-muted italic">
        مساحة إعلانية مستقبلية
      </div>
    </div>
  );

  const PharmacyView = () => (
    <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-right">
          <h2 className="text-3xl font-black text-text-main">نظام المبيعات</h2>
          <p className="text-text-muted">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center min-w-[140px]">
             <span className="text-xs text-text-muted font-bold mb-1">عدد الأصناف</span>
             <span className="text-2xl font-black text-primary">{meds.length}</span>
          </div>
          <div className="bg-bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center min-w-[140px]">
             <span className="text-xs text-text-muted font-bold mb-1">الإجمالي</span>
             <span className="text-2xl font-black text-primary">{calculateTotal(meds).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-bg-card p-8 rounded-[32px] border border-border shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-bold px-2">اسم العلاج</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: بانادول إكسترا"
              className="w-full h-14 px-6 bg-bg-main border-2 border-transparent focus:border-primary rounded-2xl text-lg outline-none transition-all placeholder:text-text-muted/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold px-2">السعر</label>
            <input 
              type="text" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-32 h-14 px-6 bg-bg-main border-2 border-transparent focus:border-primary rounded-2xl text-lg outline-none transition-all placeholder:text-text-muted/40 text-center"
            />
          </div>
          <button 
            onClick={addMed}
            className="h-14 bg-primary hover:bg-primary-hover text-white px-8 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <Plus size={24} /> إضافة
          </button>
        </div>
      </div>

      <div className="bg-bg-card p-6 rounded-[32px] border border-border shadow-md space-y-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث في مبيعات اليوم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pr-12 pl-4 bg-bg-main border-border border rounded-xl outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="overflow-hidden border border-border/50 rounded-2xl">
          <table className="w-full text-right">
            <thead className="bg-bg-main border-b border-border">
              <tr>
                <th className="p-4 text-xs font-bold text-text-muted">اسم العلاج</th>
                <th className="p-4 text-xs font-bold text-text-muted">السعر</th>
                <th className="p-4 text-xs font-bold text-text-muted text-center w-24">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeds.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-text-muted italic">لا توجد سجلات مطابقة</td>
                </tr>
              ) : (
                filteredMeds.map((m) => (
                  <tr key={m.id} className="border-b border-border/30 last:border-0 hover:bg-bg-main/50 transition-colors">
                    <td className="p-4 font-bold">{m.name}</td>
                    <td className="p-4 font-black text-primary">{m.price} ج.م</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setMeds(meds.filter(x => x.id !== m.id))}
                        className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button 
        onClick={confirmStartNewDay}
        className="w-full h-16 border-2 border-dashed border-primary/40 hover:border-primary text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-primary/5"
      >
        <RotateCcw className="w-5 h-5" /> بدء يوم جديد وأرشفة الحالي
      </button>
    </div>
  );

  const AIView = () => (
    <div className="w-full max-w-4xl h-[75vh] bg-bg-card rounded-[32px] border border-border shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="p-6 bg-primary text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-none text-white">المساعد الذكي</h2>
            <span className="text-xs text-white/70">متصل وجاهز للمساعدة</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold">نشط</span>
        </div>
      </div>

      <div 
        ref={chatScrollRef}
        className="flex-grow p-8 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900/30"
      >
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-5 rounded-[24px] text-base leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-bg-card text-text-main border border-border rounded-bl-none'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-black uppercase">الرد الذكي</span>
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-bg-card border border-border p-4 rounded-[24px] rounded-bl-none shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm font-bold text-text-muted">جاري المعالجة...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-bg-card">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-4 px-6 h-16 bg-bg-main border-2 border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 rounded-2xl transition-all shadow-inner"
        >
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="اسأل عن الأدوية، الجرعات، أو موانع الاستعمال..."
            className="flex-grow bg-transparent outline-none text-right font-medium"
          />
          <button 
            type="submit"
            disabled={!chatInput.trim() || isTyping}
            className="w-12 h-12 bg-primary hover:bg-primary-hover disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95"
          >
            <Send className="w-5 h-5 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );

  const ReportsView = () => {
    const chartData = useMemo(() => {
      return [...history].reverse().slice(-7).map(h => ({
        name: h.date.split('،')[1]?.trim().split(' ')[0] || h.date,
        total: h.total
      }));
    }, [history]);

    const totalRevenue = history.reduce((sum, h) => sum + h.total, 0);
    const totalOps = history.reduce((sum, h) => sum + h.meds.length, 0);

    return (
      <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-bg-card border border-border rounded-[32px] shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Wallet size={28} />
            </div>
            <h4 className="text-text-muted text-sm font-bold mb-1">إجمالي الأرباح</h4>
            <div className="text-3xl font-black text-primary">{totalRevenue.toFixed(2)}</div>
          </div>
          <div className="p-8 bg-bg-card border border-border rounded-[32px] shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-4">
              <Activity size={28} />
            </div>
            <h4 className="text-text-muted text-sm font-bold mb-1">إجمالي العمليات</h4>
            <div className="text-3xl font-black text-accent">{totalOps}</div>
          </div>
          <div className="p-8 bg-bg-card border border-border rounded-[32px] shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
              <Calendar size={28} />
            </div>
            <h4 className="text-text-muted text-sm font-bold mb-1">الأيام النشطة</h4>
            <div className="text-3xl font-black text-indigo-500">{history.length}</div>
          </div>
        </div>

        <div className="bg-bg-card p-8 rounded-[32px] border border-border shadow-md">
          <h3 className="text-xl font-black mb-8 flex items-center gap-2">
            <BarChart3 className="text-primary" /> نمو المبيعات (آخر ٧ أيام)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card p-8 rounded-[32px] border border-border shadow-md">
          <h3 className="text-xl font-black mb-6">الأيام السابقة بالتفصيل</h3>
          <div className="flex flex-col gap-4">
            {history.length === 0 ? (
              <p className="text-center py-12 text-text-muted italic">لا يوجد سجل تاريخي متاح حالياً</p>
            ) : (
              history.map((record, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center justify-between p-6 bg-bg-main border border-border rounded-2xl hover:border-primary transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-bg-card border border-border rounded-xl flex items-center justify-center font-bold text-text-muted">
                      {i + 1}
                    </div>
                    <div>
                      <h5 className="font-bold">{record.date}</h5>
                      <span className="text-xs text-text-muted font-bold uppercase">{record.meds.length} عملية بيع</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-primary">{record.total.toFixed(2)} ج.م</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-full h-32 bg-slate-100 dark:bg-slate-800/50 rounded-[32px] border-2 border-dashed border-border flex items-center justify-center text-text-muted italic">
          مساحة إعلانية مستقبلية
        </div>
      </div>
    );
  };

  const StaticView = ({ type }: { type: 'about' | 'contact' | 'privacy' }) => {
    const titles = { about: 'عن المنصة', contact: 'اتصل بنا', privacy: 'سياسة الخصوصية' };
    return (
      <div className="w-full max-w-4xl bg-bg-card p-12 rounded-[40px] border border-border shadow-xl space-y-8 animate-in fade-in scale-95 duration-500">
        <h2 className="text-4xl font-black text-text-main text-center">{titles[type]}</h2>
        
        {type === 'about' && (
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-text-muted text-center leading-relaxed">
              تعد منصة الصيدلية الذكية رائدة في توفير الحلول الرقمية للصيادلة في الوطن العربي، حيث ندمج سهولة الإدارة مع كفاءة الذكاء الاصطناعي لتوفير تجربة عمل سلسة ومثمرة.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border">
                <CheckCircle2 className="text-primary mb-3" />
                <h4 className="font-bold mb-2">رؤيتنا</h4>
                <p className="text-sm opacity-80">تحويل كل صيدلية إلى وحدة ذكية تعمل بأقصى كفاءة وبأقل مجهود يدوي.</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border">
                <CheckCircle2 className="text-primary mb-3" />
                <h4 className="font-bold mb-2">قيمة العمل</h4>
                <p className="text-sm opacity-80">الدقة المطلقة في الحسابات وتوفير المعلومات الطبية الفورية والموثوقة.</p>
              </div>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] space-y-4">
                 <Mail className="w-12 h-12 text-primary mx-auto" />
                 <h4 className="font-bold">البريد الإلكتروني</h4>
                 <p className="text-primary font-bold">support@smartpharm.com</p>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] space-y-4">
                 <Users className="w-12 h-12 text-primary mx-auto" />
                 <h4 className="font-bold">الدعم الفني</h4>
                 <p className="text-primary font-bold">متاح ٢٤/٧ لصيادلتنا</p>
              </div>
            </div>
            <form className="bg-bg-main p-8 rounded-3xl border border-border space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">الاسم</label>
                    <input className="w-full h-12 px-4 bg-bg-card border border-border rounded-xl outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">البريد</label>
                    <input className="w-full h-12 px-4 bg-bg-card border border-border rounded-xl outline-none focus:border-primary" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-bold">الرسالة</label>
                  <textarea className="w-full h-32 p-4 bg-bg-card border border-border rounded-xl outline-none focus:border-primary resize-none" />
               </div>
               <button className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">إرسال الاستفسار</button>
            </form>
          </div>
        )}

        {type === 'privacy' && (
          <div className="space-y-6 text-right leading-loose">
            <section className="space-y-3">
              <h3 className="text-xl font-bold border-r-4 border-primary pr-3">خصوصية البيانات</h3>
              <p className="text-text-muted">نحن نؤمن بأن بيانات صيدليتك هي ملكك بالكامل. يتم تخزين جميع السجلات محلياً في متصفحك ولا نطلع على مبيعاتك أو بيانات مرضاك.</p>
            </section>
            <section className="space-y-3">
              <h3 className="text-xl font-bold border-r-4 border-primary pr-3">مساعد الذكاء الاصطناعي</h3>
              <p className="text-text-muted">عند استخدام الشات، يتم إرسال الأسئلة لمعالجتها دون تخزين معلومات شخصية مرتبطة بها، وذلك لضمان جودة الردود الطبية.</p>
            </section>
            <section className="space-y-3">
              <h3 className="text-xl font-bold border-r-4 border-primary pr-3">التحديثات المستمرة</h3>
              <p className="text-text-muted">نقوم بتحديث بروتوكولات الأمان دورياً لضمان استقرار المنصة وحماية بيانات المستخدمين من أي تهديدات تقنية.</p>
            </section>
          </div>
        )}
      </div>
    );
  };

  // --- UI Parts ---
  
  const NavItem = ({ view, icon, label }: { view: View, icon: any, label: string }) => (
    <button 
      onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
        currentView === view 
          ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1' 
          : 'text-text-muted hover:bg-primary/5 hover:text-primary'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {currentView === view && (
        <motion.div layoutId="nav-pill" className="mr-auto w-1.5 h-6 bg-white rounded-full" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col md:flex-row font-sans selection:bg-primary/20">
      
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <Pill className="w-8 h-8" />
          <span className="font-extrabold text-lg">الصيدلية الذكية</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-primary/5 rounded-xl text-primary">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || !window.matchMedia('(max-width: 768px)').matches) && (
          <motion.aside 
            initial={window.matchMedia('(max-width: 768px)').matches ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed md:sticky top-0 h-screen w-72 bg-bg-card border-l border-border md:border-l-0 md:border-r z-[90] p-6 flex flex-col gap-8 shadow-xl md:shadow-none overflow-y-auto ${isSidebarOpen ? 'right-0' : 'hidden md:flex'}`}
          >
            <div className="flex items-center gap-3 px-4 py-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Pill size={24} />
              </div>
              <h1 className="text-xl font-black text-primary leading-none">الصيدلية الذكية</h1>
            </div>

            <div className="flex-grow space-y-2">
              <NavItem view="home" icon={<Home size={20} />} label="الرئيسية" />
              <NavItem view="pharmacy" icon={<LayoutDashboard size={20} />} label="إدارة الصيدلية" />
              <NavItem view="ai" icon={<Bot size={20} />} label="المساعد الذكي" />
              <NavItem view="reports" icon={<BarChart3 size={20} />} label="التقارير اليومية" />
              <div className="py-4 opacity-30 px-6 font-bold text-[10px] uppercase tracking-[2px]">معلومات</div>
              <NavItem view="about" icon={<Info size={20} />} label="عن المنصة" />
              <NavItem view="contact" icon={<Mail size={20} />} label="اتصل بنا" />
              <NavItem view="privacy" icon={<Shield size={20} />} label="الخصوصية" />
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-border border font-bold hover:border-primary transition-all group"
              >
                {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-500" />}
                <span className="text-sm group-hover:text-primary">{darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
              </button>
              <div className="text-[10px] text-text-muted text-center font-bold">
                الإصدار الاحترافي v2.0
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-h-screen relative overflow-x-hidden">
        
        {/* Top Floating bar (desktop) */}
        {!window.matchMedia('(max-width: 768px)').matches && (
          <header className="h-20 px-12 flex items-center justify-between sticky top-0 bg-bg-main/80 backdrop-blur-md z-40">
             <div className="flex items-center gap-2">
                <HeartPulse className="text-primary w-5 h-5" />
                <span className="text-sm font-bold opacity-60">نظام إدارة صيدلية متكامل</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="bg-bg-card border border-border px-4 py-2 rounded-xl text-xs font-black shadow-sm">
                   {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <div className="w-10 h-10 bg-bg-card rounded-full border border-border flex items-center justify-center overflow-hidden">
                   <div className="w-full h-full bg-gradient-to-tr from-primary to-accent" />
                </div>
             </div>
          </header>
        )}

        <div className="flex-grow p-6 md:p-12 flex flex-col items-center">
           <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center"
              >
                {currentView === 'home' && <HeroSection />}
                {currentView === 'pharmacy' && <PharmacyView />}
                {currentView === 'ai' && <AIView />}
                {currentView === 'reports' && <ReportsView />}
                {(currentView === 'about' || currentView === 'contact' || currentView === 'privacy') && <StaticView type={currentView} />}
              </motion.div>
           </AnimatePresence>
        </div>

        <footer className="w-full py-8 text-center text-text-muted/50 text-xs font-bold border-t border-border/30 bg-bg-card/30">
           &copy; ٢٠٢٤ منصة الصيدلية الذكية - مدعوم بتقنيات Gemini
        </footer>
      </main>

      {/* Overlays / Modals */}
      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] bg-danger text-white px-8 py-4 rounded-[24px] shadow-[0_20px_50px_rgba(239,68,68,0.3)] font-black flex items-center gap-3 border-2 border-white/20"
          >
            <AlertCircle size={20} />
            {errorToast}
          </motion.div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-bg-card w-full max-w-md rounded-[40px] p-10 shadow-huge border border-border flex flex-col items-center text-center gap-8"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-[30px] flex items-center justify-center text-primary">
                <RotateCcw size={40} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-text-main">بدء مبيعات يوم جديد؟</h3>
                <p className="text-text-muted leading-relaxed font-medium">سيتم أرشفة مبيعات اليوم الحالي وحفظها في التقارير التاريخية وتصفير الجدول الحالي.</p>
              </div>
              <div className="flex gap-4 w-full pt-4">
                <button onClick={executeStartNewDay} className="flex-1 h-14 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black shadow-xl shadow-primary/30 transition-all active:scale-95">تأكيد وأرشفة</button>
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 h-14 bg-bg-main border border-border text-text-muted rounded-2xl font-black hover:text-text-main transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

const AlertCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
