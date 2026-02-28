'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ScanFace,
  CheckCircle2,
  Cpu,
  Smartphone,
  WifiOff,
  Bot
} from 'lucide-react';
import SignupModal from '../../components/SignupModal';

gsap.registerPlugin(ScrollTrigger);

// --- PLAN DATA (for PayFast integration) ---
const TIERS = [
  {
    id: 'core',
    label: 'TIER_01',
    title: 'Core Pulse',
    staff: 'Up to 30 Staff',
    price: 'R1,900',
    features: ["Primary AI Face ID", "Automated Payroll Engine", "Localized Tax Compliance", "Mobile Signature Gateway"],
    popular: false,
  },
  {
    id: 'scale',
    label: 'TIER_02',
    title: 'Strategic Scale',
    staff: 'Up to 50 Staff',
    price: 'R2,500',
    features: ["Advanced Biometric Recognition", "Automated Compliance Vault", "Real-time Workforce Alerts", "Priority Administrative Logic"],
    popular: true,
  },
  {
    id: 'enterprise',
    label: 'TIER_03',
    title: 'Apex Enterprise',
    staff: 'Up to 100 Staff',
    price: 'R4,500',
    features: ["Full AI Managed Infrastructure", "High-Fidelity Data Vaulting", "Cross-Zone Load Balancing", "24/7 Strategic Override"],
    popular: false,
  },
];

// --- ATOM COMPONENTS ---

const RealisticButterflySVG = ({ className, flapSpeed, delay, variant = "yellow" }: { className?: string; flapSpeed: number; delay: number; variant?: string }) => {
  const isBlack = variant === "black";

  return (
    <div className={`relative ${className || ''}`} style={{ width: 96, height: 96, transformStyle: 'preserve-3d', perspective: 1200 }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 z-20 overflow-visible pointer-events-none">
        <path d="M 46 25 Q 35 5 25 10" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 54 25 Q 65 5 75 10" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="25" cy="10" r="1.5" fill="#111" />
        <circle cx="75" cy="10" r="1.5" fill="#111" />
        <ellipse cx="50" cy="50" rx="4" ry="18" fill="url(#bodyGrad)" />
        <circle cx="50" cy="25" r="5" fill="url(#bodyGrad)" />
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#050505" />
            <stop offset="50%" stopColor={isBlack ? "#FFE600" : "#333"} />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
          <radialGradient id={`wingGradR-${variant}`} cx="20%" cy="30%" r="90%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="15%" stopColor="#FFF176" />
            <stop offset="40%" stopColor="#FFE500" />
            <stop offset="65%" stopColor="#FFC400" />
            <stop offset="80%" stopColor="#FF8F00" />
            <stop offset="93%" stopColor="#1a0800" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <radialGradient id={`wingGradL-${variant}`} cx="80%" cy="30%" r="90%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="15%" stopColor="#FFF176" />
            <stop offset="40%" stopColor="#FFE500" />
            <stop offset="65%" stopColor="#FFC400" />
            <stop offset="80%" stopColor="#FF8F00" />
            <stop offset="93%" stopColor="#1a0800" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
        </defs>
      </svg>
      <div className="absolute top-0 left-0 w-full h-full butterfly-realistic-wing-left" style={{ animation: `flapLeft ${flapSpeed}s ${delay}s infinite alternate ease-in-out` }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 overflow-visible">
          <path d="M 48 35 C 20 5 0 25 5 50 C 8 60 25 55 46 50 Z" fill={`url(#wingGradL-${variant})`} stroke="#333" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 46 50 C 25 60 10 75 18 90 C 26 100 35 105 38 105 C 38 98 42 90 48 70 Z" fill={`url(#wingGradL-${variant})`} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 45 48 Q 20 20 8 40" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <path d="M 46 50 Q 15 65 20 85" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
          <circle cx="12" cy="45" r="3" fill="#FFEB3B" />
          <circle cx="20" cy="80" r="3.5" fill="#FF6D00" />
          <circle cx="32" cy="94" r="2.5" fill="#FFEB3B" />
        </svg>
      </div>
      <div className="absolute top-0 left-0 w-full h-full butterfly-realistic-wing-right" style={{ animation: `flapRight ${flapSpeed}s ${delay}s infinite alternate ease-in-out` }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 overflow-visible">
          <path d="M 52 35 C 80 5 100 25 95 50 C 92 60 75 55 54 50 Z" fill={`url(#wingGradR-${variant})`} stroke="#333" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 54 50 C 75 60 90 75 82 90 C 74 100 65 105 62 105 C 62 98 58 90 52 70 Z" fill={`url(#wingGradR-${variant})`} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 55 48 Q 80 20 92 40" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <path d="M 54 50 Q 85 65 80 85" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
          <circle cx="88" cy="45" r="3" fill="#FFEB3B" />
          <circle cx="80" cy="80" r="3.5" fill="#FF6D00" />
          <circle cx="68" cy="94" r="2.5" fill="#FFEB3B" />
        </svg>
      </div>
    </div>
  );
};

// --- SECTIONS ---

const Navbar = () => (
  <nav className="hero-bg-transition fixed top-0 left-0 right-0 z-50 h-[96px] flex items-center transition-colors duration-[3s]" style={{ backgroundColor: '#F5F5F7' }}>
    <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between w-full">
      <div className="flex items-center text-obsidian">
        <span className="font-sans font-black text-[1.4rem] md:text-[2.5rem] tracking-widest uppercase leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          STAFFPAY
        </span>
        <div className="flex flex-col gap-[3px] items-center justify-center ml-1 mr-3 md:ml-1.5 md:mr-4 -translate-y-[1px] md:-translate-y-0.5 pointer-events-none">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-led-1" />
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-led-2" />
        </div>
        <span className="font-sans font-black text-[1.4rem] md:text-[2.5rem] tracking-widest uppercase leading-none text-[#FDC00F] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          AI
        </span>
      </div>
      <Link
        href="/login"
        className="px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] border border-slate-300 bg-white text-slate-800 hover:border-[#FDC00F] hover:text-[#b45309] hover:shadow-[0_0_20px_rgba(250,204,21,0.15)] transition-all duration-300"
      >
        Login
      </Link>
    </div>
  </nav>
);

const SwipeReveal = ({ onComplete, onStart }: { onComplete: () => void; onStart?: () => void }) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [showText, setShowText] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (!isSwiped) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => { onComplete(); }, 3000);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSwiped, onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => { if (startY.current - e.touches[0].clientY > 30) setIsSwiped(true); };
  const handleWheel = (e: React.WheelEvent) => { if (e.deltaY > 20) setIsSwiped(true); };

  return (
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-[3000ms] ease-in-out flex items-center justify-center cursor-pointer bg-silver ${isSwiped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
      onClick={() => { setIsSwiped(true); if (onStart) onStart(); }}
    >
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[4px] z-10" />
      <Image
        src="/chaotic_office_90s.png"
        alt="Chaotic 90s Office"
        fill
        priority
        quality={100}
        className="object-cover z-0"
      />
      <div className={`relative z-20 flex flex-col items-center gap-4 pt-[80dvh] transition-opacity duration-1000 ${showText ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
        <span className="text-slate-900 font-sans font-black tracking-widest uppercase text-lg text-center px-8 text-balance drop-shadow-md">
          Click to digitize
        </span>
        <div className="w-8 h-12 border-2 border-slate-900 rounded-full flex justify-center p-2 opacity-80">
          <div className="w-1 h-3 bg-slate-900 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};

const Hero = ({ isRevealed }: { isRevealed: boolean }) => {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isRevealed) return;

    const ctx = gsap.context(() => {
      gsap.set('.hero-payroll-intel-text', { opacity: 0 });
      gsap.set('.hero-desk-layer', { opacity: 1, filter: 'blur(0px)' });
      gsap.set('.hero-beach-layer', { opacity: 0 });

      const mm = gsap.matchMedia();

      mm.add({
        isDesktop: "(min-width: 768px)",
        isMobile: "(max-width: 767px)"
      }, (context) => {
        const { isDesktop } = context.conditions!;
        const target1X = isDesktop ? "-2vw" : "1vw";
        const target1Y = isDesktop ? "44vh" : "42vh";
        const s = isDesktop ? 0.9 : 0.53;

        gsap.set('.bug-target-1', { x: target1X, y: target1Y, scale: 0.65 * s, rotationZ: -10, opacity: 1 });
        gsap.set('.butterfly-realistic-wing-left, .butterfly-realistic-wing-right', { animationPlayState: 'paused' });

        const tl = gsap.timeline({ repeat: 0 });
        tl.to('.hero-payroll-intel-text', { opacity: 1, duration: 2, ease: 'power2.inOut' });
        tl.to({}, { duration: 1 });
        tl.set('.butterfly-realistic-wing-left, .butterfly-realistic-wing-right', { animationPlayState: 'running' });

        tl.to('.bug-target-1', {
          keyframes: [
            { x: "10vw", y: "20vh", scale: 0.75 * s, rotationZ: 15, duration: 1.5, ease: 'sine.inOut' },
            { x: "-15vw", y: "15vh", scale: 0.7 * s, rotationZ: -10, duration: 1.0, ease: 'sine.inOut' },
            { x: "-60vw", y: "5vh", scale: 0.5 * s, rotationZ: -60, duration: 1.0, ease: 'power2.in' },
            { x: "-60vw", y: "5vh", scale: 0, opacity: 0, rotationZ: 0, duration: 5.0, ease: 'none' },
            { x: "100vw", y: "-30vh", scale: 0.6 * s, opacity: 0, rotationZ: -15, duration: 0.01, ease: 'none' },
            { x: "30vw", y: "-30vh", scale: 0.6 * s, opacity: 1, rotationZ: -15, duration: 2.5, ease: 'power2.out' },
            { x: "-10vw", y: "-40vh", scale: 0.8 * s, opacity: 1, rotationZ: 10, duration: 3, ease: 'sine.inOut' },
            { x: "15vw", y: "-25vh", scale: 0.7 * s, opacity: 1, rotationZ: -5, duration: 3, ease: 'sine.inOut' },
            { x: "-60vw", y: "-40vh", scale: 0.9 * s, opacity: 0, rotationZ: -30, duration: 2.5, ease: 'power2.inOut' }
          ]
        }, 2);

        tl.set('.butterfly-realistic-wing-left, .butterfly-realistic-wing-right', { animationPlayState: 'paused' });

        tl.to('.hero-desk-layer', { opacity: 0, filter: 'blur(20px)', duration: 2, ease: 'power1.inOut' }, 8.0)
          .to('.hero-beach-layer', { opacity: 1, duration: 3, ease: 'power1.inOut' }, "<");

        tl.to('.hero-payroll-intel-text', { color: '#050505', duration: 2, ease: 'power1.inOut' }, 2)
          .to('.hero-payroll-intel-text', { opacity: 0, duration: 1, ease: 'power1.inOut' }, 5.5);

        tl.to('.hero-tech-text', { opacity: 1, duration: 1, ease: 'power1.inOut' }, 6.2)
          .to('.hero-tech-text', { opacity: 0, duration: 2, ease: 'power1.inOut' }, 8.0);

        tl.fromTo('.hero-punct-excl', { opacity: 1, scale: 1, transformOrigin: 'bottom center' }, { opacity: 0, scale: 0, duration: 2, ease: 'power1.inOut' }, 3.5);
        tl.fromTo('.hero-punct-dot', { opacity: 0, scale: 0, transformOrigin: 'bottom center' }, { opacity: 1, scale: 1, duration: 2, ease: 'power1.inOut' }, 3.5);
      });

      return () => mm.revert();
    }, heroRef);

    return () => ctx.revert();
  }, [isRevealed]);

  return (
    <section ref={heroRef} className="hero-bg-transition fade-group relative min-h-[100dvh] pt-32 pb-12 px-6 md:px-12 lg:px-24 flex flex-col justify-between overflow-hidden md:sticky md:top-0 z-[1]" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="hero-beach-layer absolute inset-0 z-[2] pointer-events-none origin-center opacity-0 transition-opacity duration-1000">
        <Image
          src="/relaxed_beach_woman_yellow.png"
          alt="Serene Beach Relax"
          fill
          quality={100}
          className="object-cover object-center brightness-105 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-silver/70 via-silver/20 to-white/30 mix-blend-overlay" />
      </div>

      {/* Desk & Router */}
      <div className="hero-desk-layer absolute top-[calc(50%_-_3rem)] -translate-y-1/2 md:top-[96px] md:translate-y-0 right-0 w-[126%] sm:w-[70%] md:w-[65%] lg:w-[50%] z-[5] pointer-events-none flex items-start justify-end overflow-hidden">
        <div className="relative w-full flex items-start justify-end translate-x-[5%] md:translate-x-[2%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/staffpay_ai_desk_router.png"
            alt="Minimalist Large Desk with Yellow Router"
            className="w-full h-auto object-cover object-right-top xl:translate-x-6"
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 20%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%)' }}
          />
        </div>
      </div>

      {/* Butterfly */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 opacity-90 flex items-center justify-center">
        <div className="absolute bug-target-1 scale-[0.375] md:scale-[0.61]">
          <div className="bug-erratic-wobble">
            <RealisticButterflySVG flapSpeed={0.15} delay={0} variant="yellow" />
          </div>
        </div>
      </div>

      {/* Hero Text */}
      <div className="absolute bottom-[3vh] left-0 w-full z-[15] flex flex-col items-center pointer-events-none md:relative md:bottom-auto md:flex-row md:items-end md:justify-between md:mt-auto md:max-w-7xl md:mx-auto md:pb-4 md:gap-8 bg-transparent">
        <div className="flex flex-col items-center md:items-start gap-4 mb-4 w-full md:w-auto">
          <h1 className="hero-element w-full grid px-4 text-center md:text-left">
            <span className="hero-payroll-intel-text col-start-1 row-start-1 text-[#FDC00F] text-[1.575rem] md:text-[2.8125rem] tracking-widest leading-none pointer-events-auto flex flex-row flex-wrap justify-center md:justify-start items-baseline gap-x-3 md:gap-x-5">
              <span className="font-sans font-black uppercase tracking-widest">payroll</span>
              <span className="font-drama italic lowercase">
                Intelligence<span className="inline-grid align-baseline"><span className="hero-punct-dot col-start-1 row-start-1 text-center">.</span><span className="hero-punct-excl col-start-1 row-start-1 text-center opacity-0 text-[#FDC00F]">!</span></span>
              </span>
            </span>
            <span className="hero-tech-text col-start-1 row-start-1 text-[#050505] text-[1.575rem] md:text-[2.8125rem] tracking-widest leading-none pointer-events-auto opacity-0 flex flex-row items-center justify-center md:justify-start">
              <span className="font-drama italic lowercase">
                Let technology do the work for you.
              </span>
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
};

const Philosophy = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.phil-line', {
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
        y: 50, opacity: 0, duration: 1.5, stagger: 0.2, ease: 'power3.out'
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="fade-group md:sticky md:top-0 z-[2] relative py-40 px-6 md:px-12 lg:px-24 bg-silver text-slate-900 overflow-hidden flex items-center justify-center min-h-[100dvh]">
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=2600" alt="Abstract Lines" className="w-full h-full object-cover opacity-[0.2] mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian" />
      </div>
      <div className="relative z-10 max-w-5xl w-full">
        <div className="phil-line text-sm md:text-xl font-sans font-bold uppercase tracking-widest text-slate-500 mb-12 border-l-2 border-gold/30 pl-8">
          Most workforce software focuses on data entry.
        </div>
        <div className="phil-line text-5xl md:text-7xl lg:text-[7rem] font-sans font-bold leading-[0.9] tracking-tighter uppercase">
          We focus on <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold via-ivory to-[#b45309] font-drama italic lowercase tracking-normal">automation.</span>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const [shuffleItems, setShuffleItems] = useState([
    { id: 1, label: 'PAYROLL_EXECUTION', color: 'bg-silver border border-gold/20 text-gold' },
    { id: 2, label: 'TAX_SYNC_ACTIVE', color: 'bg-gradient-to-r from-gold to-[#fef08a] text-obsidian font-black' },
    { id: 3, label: 'BANK_DISPATCH', color: 'bg-platinum text-slate-900 border border-slate-200' }
  ]);
  const [typeWriterText, setTypeWriterText] = useState('');
  const fullTypeWriter = ">> INITIATING ZERO-CONN MODE\n>> CACHING ROSTER BLOCKS\n>> SYNCING WHEN RECEPTION FOUND\n>> INDUSTRIAL GRID SECURED...";

  useEffect(() => {
    const shuffle = setInterval(() => {
      setShuffleItems(prev => {
        const next = [...prev];
        next.unshift(next.pop()!);
        return next;
      });
    }, 3000);

    let charIdx = 0;
    const type = setInterval(() => {
      if (charIdx < fullTypeWriter.length) {
        setTypeWriterText(prev => prev + fullTypeWriter[charIdx]);
        charIdx++;
      } else {
        setTimeout(() => { setTypeWriterText(''); charIdx = 0; }, 4000);
      }
    }, 50);

    return () => { clearInterval(shuffle); clearInterval(type); };
  }, []);

  return (
    <section id="features" className="fade-group md:sticky md:top-0 z-[3] py-16 md:py-32 px-6 md:px-12 lg:px-24 bg-platinum border-y border-gold/10 relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-10 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12">
          <div>
            <h2 className="text-slate-900 text-3xl sm:text-5xl md:text-7xl font-sans font-bold uppercase tracking-tighter leading-none">
              Modular <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold to-[#b45309] font-drama italic lowercase">intelligence.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8">
          {/* AI Agent Card */}
          <div className="bg-white backdrop-blur-xl p-4 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-300 hover:border-gold/30 flex flex-col h-auto md:h-[500px] hover:shadow-[0_0_40px_rgba(250,204,21,0.15)] transition-all duration-500 overflow-hidden relative group">
            <div className="mb-2 md:mb-auto flex items-start gap-3 md:block">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-300 flex items-center justify-center shrink-0 md:mb-6 shadow-inner"><Cpu className="w-4 h-4 md:w-5 md:h-5 text-gold" /></div>
              <div>
                <h3 className="text-lg md:text-4xl font-bold uppercase tracking-tighter text-slate-900 mb-1 md:mb-3">AI Agent</h3>
                <p className="text-xs md:text-lg font-medium text-slate-500 leading-relaxed uppercase tracking-wider">Automates complex payroll formulas, executes secure bank deposits, and files compliance taxes.</p>
              </div>
            </div>
            <div className="hidden md:relative md:flex h-32 md:h-48 overflow-hidden items-center justify-center w-full">
              {shuffleItems.map((item, idx) => (
                <div key={item.id} className={`absolute w-[90%] h-14 rounded-2xl flex items-center justify-center text-[10px] font-mono tracking-[0.2em] transition-all duration-[800ms] shadow-lg ${item.color}`}
                  style={{ transform: `translateY(${(idx - 1) * 70}px) scale(${idx === 1 ? 1 : 0.85})`, opacity: idx === 1 ? 1 : 0.3, zIndex: idx === 1 ? 10 : 0 }}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Field App Card */}
          <div className="bg-white backdrop-blur-xl p-4 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-300 hover:border-gold/30 flex flex-col h-auto md:h-[500px] hover:shadow-[0_0_40px_rgba(250,204,21,0.15)] transition-all duration-500 overflow-hidden relative group">
            <div className="mb-2 md:mb-auto flex items-start gap-3 md:block">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-300 flex items-center justify-center shrink-0 md:mb-6 shadow-inner"><WifiOff className="w-4 h-4 md:w-5 md:h-5 text-gold" /></div>
              <div>
                <h3 className="text-lg md:text-4xl font-bold uppercase tracking-tighter text-slate-900 mb-1 md:mb-3">Field App</h3>
                <p className="text-xs md:text-lg font-medium text-slate-500 leading-relaxed uppercase tracking-wider">Engineered for deep agricultural areas. Devices cache logic offline and sync on reconnection.</p>
              </div>
            </div>
            <div className="hidden md:block bg-black/80 shadow-inner p-4 md:p-6 rounded-[1.5rem] border border-slate-200 h-32 md:h-48 font-mono text-[10px] text-slate-900/70 whitespace-pre-wrap leading-[2.5] relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
              {typeWriterText}<span className="inline-block w-1.5 h-3 bg-gold ml-1 animate-pulse" />
            </div>
          </div>

          {/* Staff Portal Card */}
          <div className="bg-white backdrop-blur-xl p-4 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-300 hover:border-gold/30 flex flex-col h-auto md:h-[500px] hover:shadow-[0_0_40px_rgba(250,204,21,0.15)] transition-all duration-500 overflow-hidden relative group">
            <div className="mb-2 md:mb-auto flex items-start gap-3 md:block">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 md:mb-6"><Smartphone className="w-4 h-4 md:w-5 md:h-5 text-gold" /></div>
              <div>
                <h3 className="text-lg md:text-4xl font-bold uppercase tracking-tighter text-slate-900 mb-1 md:mb-3">Staff Portal</h3>
                <p className="text-xs md:text-lg font-medium text-slate-500 leading-relaxed uppercase tracking-wider">Convert any device into a secure sign-in unit. Full activity logging and roster accessibility.</p>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-7 gap-1 mt-auto bg-black/40 p-4 rounded-[1.5rem] border border-slate-200 shadow-inner">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-500">{day}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${i === 4 ? 'bg-gradient-to-br from-gold to-[#b45309] text-obsidian shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-110' : 'bg-white text-slate-500'}`}>
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProtocolStep = ({ number, title, desc, children, stepIndex }: { number: string; title: string; desc: string; children: React.ReactNode; stepIndex: number }) => (
  <div className="protocol-card min-h-[100dvh] md:sticky md:top-0 flex items-center justify-center bg-silver border-t border-slate-200 px-6 md:px-12 lg:px-24 overflow-hidden shadow-2xl" style={{ zIndex: stepIndex }}>
    <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-24 items-center">
      <div>
        <span className="text-gold font-mono text-sm md:text-xl mb-3 md:mb-6 block font-bold tracking-[0.3em]">PHASE_{number}</span>
        <h3 className="text-2xl md:text-4xl text-slate-900 font-bold mb-3 md:mb-6 uppercase tracking-tighter text-slate-900">{title}</h3>
        <p className="text-sm md:text-lg text-slate-500 font-medium uppercase tracking-wider leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center justify-center p-8 md:p-12 bg-platinum rounded-[2rem] md:rounded-[3rem] w-48 h-48 md:w-auto md:h-auto md:aspect-square mx-auto relative border border-slate-300 shadow-inner">
        {children}
      </div>
    </div>
  </div>
);

const Protocol = () => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        gsap.utils.toArray<HTMLElement>('.protocol-card').forEach((card, i, arr) => {
          if (i !== arr.length - 1) {
            ScrollTrigger.create({
              trigger: card,
              start: 'top top',
              pin: true,
              pinSpacing: false,
              scrub: true,
              onUpdate: (self) => {
                gsap.to(card, {
                  scale: 0.95 - (self.progress * 0.05),
                  opacity: 1 - (self.progress * 0.5),
                  filter: `blur(${self.progress * 10}px)`,
                  duration: 0.1
                });
              }
            });
          }
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="philosophy" ref={containerRef} className="bg-silver relative z-[4]">
      <ProtocolStep stepIndex={1} number="01" title="Identity Capture" desc="Staff members authenticate via mobile application. Biometric verification locks attendance records immutably into the ledger.">
        <div className="w-48 h-48 border border-gold/30 rounded-full flex items-center justify-center animate-spin-slow bg-gradient-to-br from-white to-slate-50 shadow-2xl">
          <ScanFace className="w-16 h-16 text-gold rounded-full bg-white p-3 border border-slate-300" />
        </div>
      </ProtocolStep>
      <ProtocolStep stepIndex={2} number="02" title="Logic Processing" desc="The AI engine computes hours, calculates localized statutory tax obligations, and flags anomalies completely autonomously.">
        <div className="w-48 h-2 bg-black relative overflow-hidden rounded-full shadow-inner border border-slate-200">
          <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-gold to-[#b45309] animate-scan rounded-full shadow-[0_0_20px_#FACC15]" />
        </div>
      </ProtocolStep>
      <ProtocolStep stepIndex={3} number="03" title="Settlement" desc="Zero manual intervention required. Bank deposit protocols and tax filings are dispatched on schedule, guaranteeing flawless execution.">
        <div className="scale-75 w-full flex items-center justify-center">
          <svg viewBox="0 0 200 100" className="w-full max-w-[200px] h-auto text-gold drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <path className="animate-waveform" d="M 10,50 L 40,50 L 50,20 L 60,80 L 70,50 L 100,50 L 110,10 L 130,90 L 150,50 L 190,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="400" strokeDashoffset="400" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </ProtocolStep>
    </section>
  );
};

const Pricing = ({ onSelectPlan }: { onSelectPlan: (planId: string) => void }) => (
  <section id="pricing" className="md:sticky md:top-0 z-[5] py-12 md:py-24 px-6 md:px-12 lg:px-24 bg-platinum border-t border-slate-200 relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
    <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gold/5 blur-[150px] rounded-full pointer-events-none translate-y-1/2" />
    <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
      <h2 className="text-slate-900 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-sans font-bold uppercase tracking-tighter mb-4 md:mb-16 leading-[0.9]">Authorization Keys.</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 w-full max-w-5xl">
        {TIERS.map((tier) => (
          <div key={tier.id} className={`relative p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col justify-between transition-all duration-700 group border shadow-2xl ${tier.popular ? 'bg-gradient-to-b from-white to-slate-50 text-slate-900 border-gold shadow-[0_10px_40px_rgba(250,204,21,0.15)] hover:shadow-[0_10px_40px_rgba(250,204,21,0.15)] md:scale-105 z-10' : 'bg-white backdrop-blur-xl text-slate-900 border-slate-300 hover:border-gold/50 hover:shadow-[0_0_40px_rgba(250,204,21,0.15)]'}`}>
            {tier.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-gold to-[#fef08a] text-obsidian px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                Highly Recommended
              </div>
            )}
            <div>
              <div className="text-[9px] font-mono text-gold mb-1 md:mb-6 uppercase font-bold tracking-[0.4em]">{tier.label}</div>
              <h3 className="text-xl md:text-3xl font-bold uppercase tracking-tighter mb-0 md:mb-2 text-slate-900">{tier.title}</h3>
              <div className="text-[10px] md:text-xs font-medium opacity-50 uppercase tracking-widest mb-1 md:mb-8 text-slate-500">{tier.staff}</div>
              <div className="hidden md:block space-y-1 md:space-y-3 mb-3 md:mb-12">
                {tier.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${tier.popular ? 'text-gold' : 'text-slate-500'}`} />
                    <span className={tier.popular ? 'text-slate-900' : 'text-slate-500'}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-2 md:mb-6 border-t border-slate-300 pt-3 md:pt-6">
                <span className="text-2xl md:text-4xl font-sans font-black tracking-tighter leading-none">{tier.price}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">/ Month</span>
              </div>
              <button
                onClick={() => onSelectPlan(tier.id)}
                className={`w-full py-3 md:py-4 rounded-full font-black uppercase text-[9px] tracking-[0.2em] transition-all border border-slate-300 ${tier.popular ? 'bg-gold text-obsidian hover:scale-105 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'bg-white text-slate-900 hover:bg-white/10 hover:text-gold'}`}
              >
                Allocate Resource
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const LandingFooter = () => (
  <footer className="md:sticky md:top-0 z-[6] bg-silver text-slate-900 pt-20 md:pt-40 pb-12 px-6 md:px-12 lg:px-24 rounded-t-[2rem] md:rounded-t-[6rem] relative overflow-hidden border-t-2 border-slate-200 min-h-[100dvh] flex flex-col justify-end">
    <div className="absolute inset-0 z-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=100&w=3840&auto=format&fit=crop" alt="Professional Woman" className="w-full h-full object-cover opacity-50 mix-blend-multiply grayscale-[50%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-silver/90 via-platinum/90 to-silver/70" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 md:gap-20 mb-16 md:mb-32 max-w-7xl mx-auto relative z-10">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 border border-gold/50 rounded-full flex items-center justify-center bg-white backdrop-blur-sm"><Bot className="w-6 h-6 text-gold" /></div>
          <span className="font-bold text-2xl md:text-4xl italic tracking-tighter uppercase text-slate-900">STAFFPAY AI</span>
        </div>
        <p className="text-slate-500 max-w-md text-base md:text-2xl font-drama italic leading-tight tracking-tight">
          Eradicating administrative latency through high-fidelity biometric logic and automated machine precision.
        </p>
      </div>
      <div>
        <h4 className="font-mono uppercase tracking-[0.5em] text-[10px] mb-10 text-gold font-bold">Protocol Grid</h4>
        <ul className="space-y-6 text-[10px] text-slate-900/60 font-bold uppercase tracking-[0.3em]">
          <li><a href="#" className="hover:text-gold hover:pl-2 transition-all block">Documentation</a></li>
          <li><a href="#" className="hover:text-gold hover:pl-2 transition-all block">API Sync</a></li>
          <li><a href="#" className="hover:text-gold hover:pl-2 transition-all block">Security Vault</a></li>
          <li><a href="#" className="hover:text-gold hover:pl-2 transition-all block">Terms of Protocol</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-mono uppercase tracking-[0.5em] text-[10px] mb-10 text-gold font-bold">System Status</h4>
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 text-center flex flex-col items-center backdrop-blur-xl shadow-inner">
          <div className="w-4 h-4 bg-emerald-500 rounded-full mb-4 shadow-[0_0_20px_#10B981] animate-pulse" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-400">All Systems Nominal</span>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-12 border-t border-slate-200 font-mono text-[9px] font-bold uppercase tracking-[0.5em] opacity-30 relative z-10">
      <span>&copy; 2026 STAFFPAY AI. SECURE LEDGER.</span>
    </div>
  </footer>
);

// --- MAIN PAGE ---

export default function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [signupPlan, setSignupPlan] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        gsap.utils.toArray<HTMLElement>('.fade-group').forEach((section) => {
          gsap.to(section, {
            opacity: 0,
            scrollTrigger: { trigger: section, start: "bottom top", end: "bottom -10%", scrub: true }
          });
        });
      });

      mm.add("(max-width: 767px)", () => {
        gsap.utils.toArray<HTMLElement>('.fade-group').forEach((section) => {
          gsap.to(section, {
            opacity: 0,
            scrollTrigger: { trigger: section, start: "bottom top", end: "bottom -5%", scrub: true }
          });
        });
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef} className="relative selection:bg-gold selection:text-obsidian bg-silver ">
      {!isRevealed && (
        <SwipeReveal
          onStart={() => setIsStarted(true)}
          onComplete={() => setIsRevealed(true)}
        />
      )}
      <Navbar />
      <Hero isRevealed={isStarted} />
      <Philosophy />
      <Features />
      <Protocol />
      <Pricing onSelectPlan={(planId) => setSignupPlan(planId)} />
      <LandingFooter />

      {/* PayFast Signup Modal */}
      {signupPlan && (
        <SignupModal
          plan={signupPlan}
          onClose={() => setSignupPlan(null)}
        />
      )}
    </main>
  );
}
