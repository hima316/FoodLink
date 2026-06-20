'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Leaf, ArrowRight, UtensilsCrossed, HandHeart, Truck,
  BarChart3, Map, Bell, Shield, Zap, Clock,
  Star,Users, CheckCircle2,
  ChevronDown, Heart, Globe,
} from 'lucide-react';
import Navbar from '../layout/Navbar';

// ==========================================
// Animation Variants
// ==========================================
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ==========================================
// Section: Hero
// ==========================================
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 dark:from-[#020c05] dark:via-[#061409] dark:to-brand-950" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, #0ea5e9 0%, transparent 40%),
                          radial-gradient(circle at 60% 80%, #a3e635 0%, transparent 40%)`,
      }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Floating blobs */}
      <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Fighting food waste, one meal at a time
          <span className="text-brand-300"></span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white leading-[1.08] tracking-tight mb-6">
          Redirect{' '}
          <span className="relative">
            <span className="relative z-10 bg-gradient-to-r from-brand-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
              Surplus Food
            </span>
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-emerald-400 rounded-full origin-left" />
          </span>
          <br />
          <span className="text-white/90">to Those in Need</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
          FoodLink bridges hotels & restaurants with NGOs and volunteers through
          real-time coordination, smart logistics, and efficient food redistribution.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/auth/register"
            className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-brand-800 font-bold text-base hover:bg-brand-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
            Start Donating Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="#how-it-works"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white font-semibold text-base hover:bg-white/10 transition-all duration-200 backdrop-blur-sm">
            How It Works
            <ChevronDown className="w-4 h-4" />
          </Link>
        </motion.div>
        </div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ==========================================
// Section: How It Works
// ==========================================
function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    {
      role: 'Hotel / Restaurant',
      icon: UtensilsCrossed,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/50',
      steps: [
        'Register & verify your establishment',
        'List surplus food with quantity & expiry',
        'Get matched with nearby NGOs instantly',
        'Track pickup in real-time',
      ],
    },
    {
      role: 'NGO / Charity',
      icon: HandHeart,
      color: 'from-brand-500 to-brand-700',
      bg: 'bg-brand-50 dark:bg-brand-950/30',
      border: 'border-brand-200 dark:border-brand-800/50',
      steps: [
        'Browse live donation feed near you',
        'One-click claim available donations',
        'Assign volunteers for pickup',
        'Receive & distribute to communities',
      ],
    },
    {
      role: 'Volunteer',
      icon: Truck,
      color: 'from-blue-500 to-blue-700',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      steps: [
        'Sign up & set your availability',
        'Get notified of pickup assignments',
        'Navigate to pickup with live map',
        'Deliver & mark as complete',
      ],
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-widest text-brand-600 uppercase mb-3">How It Works</span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            Simple for everyone,<br />
            <span className="text-gradient">powerful for all</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Many roles, one mission: zero food waste, maximum community impact.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((group, gi) => {
            const Icon = group.icon;
            return (
              <motion.div key={gi}
                variants={fadeUp} custom={gi * 0.1}
                initial="hidden" animate={inView ? 'visible' : 'hidden'}
                className={`rounded-3xl border p-7 ${group.bg} ${group.border}`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${group.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-5">{group.role}</h3>
                <ul className="space-y-3">
                  {group.steps.map((step, si) => (
                    <li key={si} className="flex items-start gap-3 text-sm text-foreground/80">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${group.color} text-white text-[10px] font-bold flex items-center justify-center mt-0.5`}>
                        {si + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register"
                  className={`mt-6 flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${group.color} bg-clip-text text-transparent hover:gap-3 transition-all`}>
                  Get started <ArrowRight className="w-4 h-4" style={{ color: gi === 0 ? '#f59e0b' : gi === 1 ? '#16a34a' : '#3b82f6' }} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// Section: Features
// ==========================================
function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const features = [
    { icon: Map, title: 'Live Leaflet Maps', desc: 'Interactive maps showing nearby NGOs, pickup points, and real-time volunteer tracking with geospatial search.', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
    { icon: Bell, title: 'Smart Notifications', desc: 'Instant alerts for new donations, claims, assignments, and emergency requests — keeping everyone in sync.', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
    { icon: Clock, title: 'Expiry Countdown', desc: 'Real-time countdown timers on every donation with urgency indicators and automatic expiry handling.', color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
    { icon: Zap, title: 'Emergency Donations', desc: 'NGOs get notified for emergency donations as top priority when expiry time is ticking fast.', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Rich charts showing meals saved, food redistributed, NGO growth, and volunteer activity over time.', color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/30' },
    { icon: Star, title: 'Volunteers Rating', desc: 'Trust highly rated Volunteers based on their work rate and assign for pickups.', color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30' },
    { icon: Globe, title: 'AI Chatbot (Gemini)', desc: 'Built-in AI assistant powered by Google Gemini for instant answers about donations, logistics, and platform usage.', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' },
    { icon: Users, title: 'Multi-Role RBAC', desc: 'Fine-grained role-based access for hotels, NGOs, volunteers, and admins with dedicated dashboards.', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
  ];

  return (
    <section id="features" ref={ref} className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-widest text-brand-600 uppercase mb-3">Platform Features</span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Everything you need,<br /><span className="text-gradient">built for impact</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A complete ecosystem designed to make food redistribution seamless, scalable, and reliable.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={i} variants={fadeUp} custom={i * 0.05}
                className="bg-card border border-border rounded-2xl p-5 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group cursor-default">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}



// ==========================================
// Section: CTA
// ==========================================
function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 px-4">
      <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}
        className="max-w-4xl mx-auto text-center">
        <div className="relative bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-12 sm:p-16 overflow-hidden shadow-premium">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #a3e635 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0ea5e9 0%, transparent 50%)`,
          }} />
          <div className="relative">
            <Leaf className="w-16 h-16 text-brand-200 mx-auto mb-6 animate-float" />
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Ready to make<br />a difference?
            </h2>
            <p className="text-brand-100/80 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of hotels, NGOs, and volunteers already using FoodLink to fight hunger and reduce food waste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register"
                className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-brand-800 font-bold text-base hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Join FoodLink Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/auth/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all">
                Sign In to Dashboard
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-brand-100/60 text-xs">
              {['Free to join', 'No credit card', 'Instant access'].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ==========================================
// Footer
// ==========================================
function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">
              Food<span className="text-brand-600">Link</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/auth/register" className="hover:text-foreground transition-colors">Register</Link>
            <span>·</span>
            <span>© © 2026 FoodLink. Empowering food redistribution for a better future.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// Main Landing Page Assembly
// ==========================================
export default function LandingClient() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
