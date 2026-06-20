'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Sparkles,
  RefreshCw, Leaf, Copy, Check,
} from 'lucide-react';
import { cn, formatTimeAgo } from '../../../lib/utils';
import useAuthStore from '../../../context/authStore';

interface Message {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
  isLoading?: boolean;
}

// ── Suggested questions grouped by topic
const SUGGESTIONS = [
  { label: '🍽️ How do I post a donation?',            text: 'How do I post a food donation as a hotel?' },
  { label: '✅ How does NGO claiming work?',            text: 'How does an NGO claim a donation?' },
  { label: '🚗 How do volunteers get assigned?',        text: 'How does the volunteer pickup assignment process work?' },
  { label: '🚨 What is an emergency donation?',         text: 'What is an emergency donation and how does it work?' },
  { label: '📊 How is impact tracked?',                 text: 'How is my impact tracked on the platform?' },
  { label: '⏱️ What happens when food expires?',        text: 'What happens when a donation expires?' },
  { label: '🗺️ How does the map work?',                 text: 'How does the live map work on FoodLink?' },
  { label: '👑 What can an admin do?',                  text: 'What are the admin capabilities on FoodLink?' },
  { label: '🔔 How do notifications work?',             text: 'How do notifications work on FoodLink?' },
  { label: '🏛️ How do I register as an NGO?',           text: 'How do I register my NGO on FoodLink?' },
  { label: '📦 What food categories are supported?',   text: 'What food categories can be donated on FoodLink?' },
  { label: '⭐ How is volunteer rating calculated?',    text: 'How is volunteer rating and performance tracked?' },
];

// ── Rich system prompt with full platform knowledge
const SYSTEM_PROMPT = `You are FoodLink Assistant — a knowledgeable, friendly, and concise AI built into the FoodLink platform.

== ABOUT FOODLINK ==
FoodLink is a smart food redistribution platform that connects:
- Hotels/Restaurants (donors of surplus food)
- NGOs/Charities (who claim and distribute food to communities)
- Volunteers (who pick up and deliver food between donors and NGOs)
- Admins (who manage the platform)

== PLATFORM FEATURES ==
1. DONATION POSTING: Hotels post surplus food with title, category, quantity, unit, expiry time, pickup address, allergens, temperature requirements (ambient/refrigerated/frozen), and an optional emergency flag.
2. LIVE FEED: NGOs browse available donations sorted by expiry time. Auto-refreshes every 45 seconds. Filters: category, emergency only, search by name.
3. CLAIMING: NGOs click "Claim Donation" to reserve a donation. Status changes from "available" to "claimed". Hotel gets notified.
4. VOLUNTEER ASSIGNMENT: NGO goes to "Claimed Donations" page, clicks "Assign Volunteer" button on a donation card. A modal shows all active volunteers with ratings. NGO selects one. Status changes to "in_transit". Volunteer gets notified.
5. DELIVERY: Volunteer picks up food, goes to "My Pickups" tab, clicks "Mark Delivered". Status becomes "delivered". Stats update for all parties.
6. EMERGENCY DONATIONS: Marked with red pulsing banner. Appear at top of NGO feed. Trigger priority notifications to all NGOs. Use for food expiring within 1-2 hours.
7. EXPIRY COUNTDOWN: Every donation card shows a live timer. Red = under 1 hour, Amber = under 3 hours, Green = more than 3 hours.
8. NOTIFICATIONS: Bell icon in top header shows unread count. All key actions trigger notifications. Full notification history at Dashboard → Notifications.
9. LEAFLET MAPS: Interactive maps on every role's dashboard. Green markers = available, Red pulsing = emergency, Amber pulsing = in transit, Purple = delivered. Click marker for popup with full details.
10. ANALYTICS: Charts showing monthly donations, meals saved, food redistributed (kg), delivery rates. Role-specific stats on personal impact.
11. AI CHATBOT: That's me! Powered by Google Gemini. Available at Dashboard → AI Assistant.

== DONATION STATUSES ==
- available: Posted by hotel, waiting for NGO to claim
- claimed: NGO has claimed it, waiting for volunteer assignment
- in_transit: Volunteer assigned, pickup in progress
- delivered: Successfully delivered to NGO
- expired: Past expiry time, automatically removed from feed
- cancelled: Cancelled by hotel or admin

== FOOD CATEGORIES ==
cooked_meals, raw_ingredients, bakery, beverages, fruits_vegetables, dairy, packaged_food, other

== ROLES & THEIR DASHBOARDS ==
HOTEL: Overview stats, New Donation form, My Donations list, History, Nearby NGOs Map, Analytics
NGO: Overview + Live Feed, Full Feed page, Claimed Donations (with volunteer assignment), Volunteers list, Emergency Requests, Map, Analytics
VOLUNTEER: Overview, My Pickups (active/assigned/completed tabs), Available Pickups, History, Map
ADMIN: Platform Overview, User Management (activate/suspend), All Donations table, Analytics, Emergency Management, Platform Map

== HOW TO ASSIGN A VOLUNTEER (STEP BY STEP) ==
1. Login as NGO
2. Go to sidebar → "Claimed" 
3. Find a donation with status "Claimed"
4. Click the blue "Assign Volunteer" button on the card
5. A modal opens showing all available volunteers with their ratings, pickups count, city, phone
6. Click "Assign" next to the volunteer you want
7. Donation status changes to "in_transit", volunteer gets notified

== TECHNICAL DETAILS ==
- Frontend: Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Leaflet Maps, Recharts
- Backend: Node.js, Express.js, TypeScript, MongoDB Atlas, Mongoose
- Auth: JWT access tokens (15min) + refresh tokens (7 days), stored in cookies
- Rate limiting: 500 requests per 15 minutes in development, 100 in production
- Password minimum: 6 characters

== RESPONSE GUIDELINES ==
- Be helpful, warm, and concise
- Use bullet points for step-by-step instructions
- Use emojis sparingly for clarity
- If you don't know something specific, say so and suggest where to look
- Always stay focused on FoodLink platform topics
- For bugs or technical issues, suggest restarting the server or checking the browser console`;

// ── Comprehensive fallback responses (used when no API key)
const getFallbackResponse = (query: string): string => {
  const q = query.toLowerCase();

  // Volunteer assignment
  if (q.includes('assign') && (q.includes('volunteer') || q.includes('pickup'))) {
    return `Here's exactly how to assign a volunteer:\n\n**Step-by-step:**\n1. Go to sidebar → **Claimed** (under NGO menu)\n2. You'll see donation cards with a blue "Assign Volunteer" button\n3. Click that button on any claimed donation\n4. A modal pops up showing all active volunteers with their ratings, pickup count, city and phone\n5. Click **Assign** next to your preferred volunteer\n6. Done! The donation moves to "In Transit" and the volunteer gets a notification automatically\n\n💡 Tip: Choose volunteers with higher ratings and more pickups for reliability.`;
  }

  // Posting donation
  if (q.includes('post') || (q.includes('creat') && q.includes('donat')) || q.includes('add donat') || q.includes('new donat')) {
    return `To post a food donation as a hotel:\n\n1. Go to sidebar → **New Donation**\n2. Fill in the form:\n   - **Title** (e.g. "Fresh Biryani — 40 portions")\n   - **Category** (cooked meals, bakery, fruits/veg, etc.)\n   - **Quantity + Unit** (e.g. 25 kg)\n   - **Estimated Servings** (how many people it can feed)\n   - **Expiry Time** (how many hours the food is good for)\n   - **Temperature** (room temp, refrigerated, or frozen)\n   - **Pickup Address**\n   - **Allergens** (optional but recommended)\n3. Toggle **Emergency** if the food needs urgent pickup (within 1-2 hours)\n4. Click **Post Donation**\n\nAll NGOs are notified immediately! 🎉`;
  }

  // Claiming donations
  if (q.includes('claim') || (q.includes('ngo') && q.includes('get'))) {
    return `How NGOs claim donations:\n\n1. Go to sidebar → **Live Feed**\n2. Browse available donations sorted by expiry time (most urgent first)\n3. Use filters to narrow down: category chips at the top, emergency toggle, or search by name\n4. Click **Claim Donation** on any card\n5. The donation is reserved for your NGO and moves to "Claimed"\n6. Go to **Claimed Donations** to assign a volunteer for pickup\n\n⚡ Act fast — popular donations get claimed quickly!`;
  }

  // Emergency donations
  if (q.includes('emerg')) {
    return `**Emergency Donations** are high-priority food items that need immediate pickup (usually expiring within 1-2 hours).\n\n**For Hotels:**\n- Toggle the red "Emergency" switch when creating a donation\n- Your donation gets a red pulsing border and "🚨 EMERGENCY" banner\n\n**For NGOs:**\n- Emergency donations appear at the TOP of your Live Feed\n- You get priority notifications\n- There's a dedicated **Emergency** page in the sidebar showing only urgent items\n- Claim and assign a volunteer as quickly as possible\n\n**On the Map:**\n- Emergency donations pulse with a red animation so they're easy to spot`;
  }

  // Volunteer flow
  if (q.includes('volunteer') || q.includes('pickup') || q.includes('deliver')) {
    return `**How volunteers work on FoodLink:**\n\n**Getting assigned:**\n- An NGO assigns you from their Claimed Donations page\n- You immediately get a notification with the donation details\n\n**Your dashboard tabs:**\n- **Active Pickups** — donations currently in transit (assigned to you)\n- **Available** — claimed donations waiting for a volunteer\n- **History** — all your completed deliveries\n\n**Completing a delivery:**\n1. Go to **My Pickups** → Active tab\n2. Click **Navigate** to get the address\n3. Pick up the food from the hotel/restaurant\n4. Click **Mark Delivered** ✅\n5. Your pickup count and stats update automatically\n\n⭐ Your rating improves with every successful, on-time delivery!`;
  }

  // Map
  if (q.includes('map')) {
    return `**The FoodLink Live Map** shows all food movements in real time:\n\n**Marker colors:**\n- 🟢 Green — Available donation (ready to claim)\n- 🔴 Red (pulsing) — Emergency donation\n- 🟡 Amber (pulsing) — In transit (volunteer on the way)\n- 🟣 Purple — Delivered\n- ⬛ Gray — Expired or cancelled\n\n**How to use it:**\n- Click any marker to see a popup with full details\n- Use the filter buttons (All / Available / Emergency / In Transit) to focus\n- The map auto-centers to fit all markers on screen\n- Available for all roles: Hotels, NGOs, Volunteers, Admin\n\nMap uses **OpenStreetMap** tiles via Leaflet.js.`;
  }

  // Notifications
  if (q.includes('notif')) {
    return `**How notifications work on FoodLink:**\n\n**Triggers:**\n- 🍽️ New donation posted → all NGOs notified\n- ✅ NGO claims donation → hotel notified\n- 🚗 Volunteer assigned → volunteer + hotel notified\n- 📦 Delivery completed → all parties notified\n- 🚨 Emergency posted → all NGOs get priority alert\n\n**Where to see them:**\n- 🔔 Bell icon (top right of any dashboard page) — shows unread count badge\n- Click bell → dropdown preview of last 10 notifications\n- Go to **Notifications** in sidebar → full history with read/unread status\n- Click "Mark all read" to clear the badge\n\nNotifications auto-refresh every 30 seconds.`;
  }

  // Expiry
  if (q.includes('expir')) {
    return `**Food expiry on FoodLink:**\n\n**Countdown timer colors on donation cards:**\n- 🟢 Green — More than 3 hours remaining\n- 🟡 Amber — Under 3 hours (warning)\n- 🔴 Red (pulsing) — Under 1 hour (critical!)\n- ❌ "Expired" — Time is up\n\n**What happens when it expires:**\n- Status automatically changes from "available" → "expired"\n- Donation disappears from the NGO live feed\n- Can no longer be claimed\n- Still visible in the hotel's History page\n\n**Best practice for hotels:**\n- Set expiry time honestly (don't overestimate how long food stays fresh)\n- Use the Emergency toggle for anything expiring in under 2 hours\n- Post donations as early as possible — give NGOs time to plan`;
  }

  // Analytics
  if (q.includes('analytic') || q.includes('stat') || q.includes('impact') || q.includes('chart')) {
    return `**Analytics on FoodLink:**\n\n**Platform-wide stats (visible to all):**\n- Total donations posted\n- Meals saved (estimated people fed)\n- Food redistributed in kg\n- Delivery success rate %\n- Number of hotels, NGOs, volunteers\n\n**Charts available:**\n- 📈 Monthly donations vs delivered (area chart)\n- 📊 Meals saved per month (bar chart)\n- 📉 Food volume in kg (line chart)\n- 🥧 User distribution by role (pie chart)\n\n**Your personal stats:**\n- Hotels: total donated, meals contributed\n- NGOs: total claimed, meals received\n- Volunteers: pickups completed, rating, completion %\n\nAccess via sidebar → **Analytics**`;
  }

  // Registration
  if (q.includes('register') || q.includes('sign up') || q.includes('creat') && q.includes('account')) {
    return `**How to register on FoodLink:**\n\n1. Click **Get Started** on the landing page or visit /auth/register\n2. **Step 1:** Choose your role:\n   - 🏨 Hotel/Restaurant — to donate food\n   - 🏛️ NGO/Charity — to receive and distribute food\n   - 🚗 Volunteer — to pick up and deliver\n3. **Step 2:** Fill in your details:\n   - Organization name (required for Hotels and NGOs)\n   - Full name, email, phone (optional)\n   - Password (minimum 6 characters)\n4. Click **Create Account**\n5. You're taken directly to your role-specific dashboard!\n\n💡 Demo accounts are available on the login page to try each role instantly.`;
  }

  // Admin
  if (q.includes('admin')) {
    return `**Admin capabilities on FoodLink:**\n\n**User Management:**\n- View all registered users\n- Filter by role (Hotel/NGO/Volunteer)\n- Activate or suspend any account\n- Search by name, email, or organization\n\n**Donation Management:**\n- See ALL donations on the platform (every role, every city)\n- Filter by status, search by name, toggle emergency-only\n- Cancel any problematic donation\n\n**Emergency Management:**\n- Dedicated page for all emergency requests\n- Cancel misused emergency flags\n\n**Analytics:**\n- Platform-wide charts and metrics\n- Monthly trends, user distribution, food volume\n\n**Platform Map:**\n- Bird's-eye view of all food movements\n- Filter by status, see real-time counts\n\nAdmin login: admin@foodlink.com / Admin@1234 (demo)`;
  }

  // Passwords / login issues
  if (q.includes('password') || q.includes('login') || q.includes('sign in') || q.includes('forgot')) {
    return `**Login & password help:**\n\n**Minimum password length:** 6 characters\n\n**Demo accounts (for testing):**\n| Role | Email | Password |\n|------|-------|----------|\n| Hotel | hotel@grandpalace.com | Hotel@1234 |\n| NGO | contact@feedthehungry.org | NGO@1234 |\n| Volunteer | amit.volunteer@gmail.com | Vol@1234 |\n| Admin | admin@foodlink.com | Admin@1234 |\n\n**Getting 429 (Too Many Requests)?**\n- You've hit the rate limit from too many attempts\n- Restart the backend server (Ctrl+C → npm run dev)\n- This resets the rate limiter immediately\n\n**Forgot password?**\n- Password reset email is not yet implemented\n- Contact your admin to reset your account`;
  }

  // Food categories
  if (q.includes('categor') || q.includes('type of food') || q.includes('what food')) {
    return `**Food categories supported on FoodLink:**\n\n🍽️ **Cooked Meals** — Biriyani, curries, rice dishes, etc.\n🥕 **Raw Ingredients** — Vegetables, spices, grains\n🥖 **Bakery & Bread** — Bread, pastries, cakes, cookies\n🥤 **Beverages** — Juices, water, soft drinks\n🥦 **Fruits & Vegetables** — Fresh produce\n🥛 **Dairy Products** — Milk, yogurt, paneer, cheese\n📦 **Packaged Food** — Sealed/canned items with long shelf life\n🍱 **Other** — Anything that doesn't fit above\n\n**Temperature requirements you can specify:**\n- 🌡️ Room Temperature (ambient)\n- ❄️ Refrigerated (2–8°C)\n- 🧊 Frozen (below 0°C)\n\nAlways specify allergens (gluten, dairy, nuts, etc.) when posting!`;
  }

  // Settings / profile
  if (q.includes('setting') || q.includes('profile') || q.includes('edit') && q.includes('account')) {
    return `**Account settings on FoodLink:**\n\nGo to sidebar → **Settings** (bottom of sidebar)\n\n**Profile tab — you can update:**\n- Organization name and type\n- Contact person name\n- Phone number\n- Bio / about section\n- Full address (street, city, state)\n\n**Security tab:**\n- Change your password\n- View account verification status\n- Check email and role info\n\n**Profile picture:**\n- Click the camera icon on your avatar to update\n\nAll changes save instantly with the **Save Changes** button.`;
  }

  // How the platform works generally
  if (q.includes('how') && (q.includes('work') || q.includes('platform') || q.includes('foodlink'))) {
    return `**How FoodLink works — the full cycle:**\n\n1. 🏨 **Hotel posts** surplus food with details and expiry time\n2. 📣 All NGOs get **notified instantly**\n3. 🏛️ **NGO claims** the donation from the Live Feed\n4. 👥 NGO **assigns a volunteer** from the Claimed Donations page\n5. 🚗 **Volunteer picks up** food from the hotel address\n6. ✅ Volunteer clicks **Mark Delivered** upon arrival at NGO\n7. 📊 **Stats update** — meals saved counter increases for everyone\n8. 🔔 All parties get **confirmation notifications**\n\nThe entire cycle typically takes 1–4 hours from posting to delivery.\n\nFoodLink handles coordination, notifications, and tracking automatically!`;
  }

  // Default response
  return `I'm FoodLink's AI Assistant! I can help you with:\n\n🍽️ **Donations** — posting, claiming, categories, expiry\n🏛️ **NGO features** — live feed, claiming, volunteer assignment\n🚗 **Volunteer features** — pickups, deliveries, history\n📊 **Analytics** — impact tracking, charts, stats\n🗺️ **Maps** — live donation map, marker colors\n🔔 **Notifications** — alerts, read/unread, settings\n👑 **Admin** — user management, platform overview\n🔐 **Account** — registration, login, settings\n\nTry asking something like:\n- *"How do I assign a volunteer to a claimed donation?"*\n- *"What happens when food expires?"*\n- *"How does the emergency donation system work?"*`;
};

export default function ChatbotPage() {
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([{
    id:        'welcome',
    role:      'assistant',
    content:   `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋 I'm your **FoodLink AI Assistant**.\n\nI have detailed knowledge about every feature on this platform. Ask me anything about:\n- Posting or claiming donations\n- Assigning volunteers\n- Using the live map\n- Understanding your analytics\n- Account settings and registration\n- Emergency donation handling\n\nWhat would you like to know?`,
    timestamp: new Date(),
  }]);

  const [input,           setInput]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [copiedId,        setCopiedId]        = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;

    setInput('');
    setShowSuggestions(false);

    const userMsg: Message = {
      id:        `user-${Date.now()}`,
      role:      'user',
      content,
      timestamp: new Date(),
    };
    const loadingId = `loading-${Date.now()}`;
    const loadingMsg: Message = {
      id:        loadingId,
      role:      'assistant',
      content:   '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    // Build history for context (exclude loading and welcome)
    const history = messages
      .filter(m => !m.isLoading && m.id !== 'welcome')
      .slice(-10) // Last 10 messages for context window
      .map(m => ({
        role:  m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      if (!apiKey) {
        // Use rich fallback
        await new Promise(r => setTimeout(r, 600));
        const fallback = getFallbackResponse(content);
        setMessages(prev => prev.map(m =>
          m.id === loadingId
            ? { ...m, content: fallback, isLoading: false }
            : m
        ));
        return;
      }

      abortRef.current = new AbortController();

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          signal:  abortRef.current.signal,
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: [
              ...history,
              { role: 'user', parts: [{ text: content }] },
            ],
            generationConfig: {
              temperature:     0.7,
              maxOutputTokens: 1024,
              topP:            0.9,
              topK:            40,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        getFallbackResponse(content);

      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: reply, isLoading: false }
          : m
      ));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      // Fall back gracefully
      const fallback = getFallbackResponse(content);
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: fallback, isLoading: false }
          : m
      ));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages(prev => prev.map(m =>
      m.isLoading ? { ...m, content: '_(Response stopped)_', isLoading: false } : m
    ));
  };

  const clearChat = () => {
    setMessages([{
      id:        `welcome-${Date.now()}`,
      role:      'assistant',
      content:   "Chat cleared! Ask me anything about FoodLink. 😊",
      timestamp: new Date(),
    }]);
    setShowSuggestions(true);
    setInput('');
  };

  // Render markdown-like bold (**text**) and newlines
  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-9rem)] flex flex-col gap-0">

      {/* ── Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-4 border-b border-border mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground">FoodLink AI Assistant</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-muted-foreground">
                {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Powered by Google Gemini' : 'Built-in knowledge base'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <button onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
              ■ Stop
            </button>
          )}
          <button onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border">
            <RefreshCw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </motion.div>

      {/* ── Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {/* Bot avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Bubble */}
              <div className={cn(
                'max-w-[82%] rounded-2xl px-4 py-3 text-sm group relative',
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
              )}>
                {msg.isLoading ? (
                  <div className="flex items-center gap-1.5 py-1">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <div key={i}
                        className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                        style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {renderContent(msg.content)}
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <p className={cn('text-[10px]',
                        msg.role === 'user'
                          ? 'text-white/60'
                          : 'text-muted-foreground/50')}>
                        {formatTimeAgo(msg.timestamp)}
                      </p>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/60 hover:text-muted-foreground">
                          {copiedId === msg.id
                            ? <Check className="w-3 h-3 text-brand-500" />
                            : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* User avatar */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions */}
      <AnimatePresence>
        {showSuggestions && messages.length <= 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-shrink-0 mb-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(s.text)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-border hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 transition-all whitespace-nowrap">
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar */}
      <div className="flex-shrink-0 border-t border-border pt-4">
        <div className="flex items-end gap-3 bg-muted/30 rounded-2xl border border-border p-3 focus-within:border-brand-400 dark:focus-within:border-brand-600 transition-colors">
          <Leaf className="w-4 h-4 text-brand-500 flex-shrink-0 mb-0.5" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about FoodLink… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60 max-h-32 disabled:opacity-60"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              input.trim() && !isLoading
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-glow'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
          FoodLink AI · Responses are for platform guidance only
        </p>
      </div>
    </div>
  );
}