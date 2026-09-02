import { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useScroll, useTransform } from 'framer-motion';

function Lantern({ className, rotateConfig, duration, glowId, delay = 0 }) {
  return (
    <motion.div 
      className={`absolute text-ethereal-primary ${className}`}
      style={{ originX: 0.5, originY: 0 }}
      animate={{ rotate: rotateConfig }}
      transition={{ duration: duration, ease: "easeInOut", repeat: Infinity, delay: delay }}
    >
      <svg viewBox="0 0 100 200" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={glowId} cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        <line x1="50" y1="0" x2="50" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
        <path d="M 40 40 L 60 40 L 55 45 L 45 45 Z" fill="currentColor" />
        <path d="M 40 45 Q 20 65 20 85 Q 20 105 40 125 L 60 125 Q 80 105 80 85 Q 80 65 60 45 Z" fill={`url(#${glowId})`} stroke="currentColor" strokeWidth="1.5" />
        <path d="M 47 45 Q 35 85 47 125 M 53 45 Q 65 85 53 125 M 50 45 L 50 125" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        <path d="M 45 125 L 55 125 L 60 130 L 40 130 Z" fill="currentColor" />
        <line x1="50" y1="130" x2="50" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.8"/>
        <line x1="50" y1="135" x2="45" y2="165" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
        <line x1="50" y1="135" x2="55" y2="165" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
      </svg>
    </motion.div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax transforms for the SVGs based on scroll
  const mountainY1 = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const mountainY2 = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);
  const mountainY3 = useTransform(scrollYProgress, [0, 1], ['0%', '2%']);
  
  // Moon transforms
  const moonY = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
  const moonRotate = useTransform(scrollYProgress, [0, 1], [0, 25]);

  // Center tether line scale
  const lineScaleY = useTransform(scrollYProgress, [0.1, 0.95], [0, 1]);
  
  // Opacity for the hero text
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

  if (!loading && user) return <Navigate to="/dashboard" replace />;
  if (loading) return null;

  return (
    <div ref={containerRef} className="relative text-white min-h-[400vh] bg-ethereal-bg overflow-hidden">
      
      {/* Background container for the drawing animations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-end justify-center">
        
        {/* SWAYING LANTERNS */}
        <div className="absolute top-0 left-[2%] md:left-[5%] w-full h-[60vh] pointer-events-none">
          <Lantern className="top-[-5%] left-[0%] w-24 h-64 md:w-32 md:h-80 drop-shadow-[0_0_15px_rgba(var(--color-primary),0.6)]" rotateConfig={[-2, 3, -2]} duration={6} glowId="g1" />
          <Lantern className="top-[-10%] left-[10%] w-16 h-48 md:w-20 md:h-64 drop-shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" rotateConfig={[3, -2, 3]} duration={7} delay={1} glowId="g2" />
          <Lantern className="top-[-2%] left-[18%] w-12 h-32 md:w-16 md:h-48 drop-shadow-[0_0_8px_rgba(var(--color-primary),0.4)]" rotateConfig={[-4, 2, -4]} duration={5} delay={2} glowId="g3" />
          <Lantern className="top-[-15%] left-[25%] w-20 h-56 md:w-24 md:h-72 drop-shadow-[0_0_12px_rgba(var(--color-primary),0.5)]" rotateConfig={[2, -3, 2]} duration={8} delay={0.5} glowId="g4" />
          <Lantern className="top-[5%] left-[32%] w-10 h-24 md:w-12 md:h-32 drop-shadow-[0_0_5px_rgba(var(--color-primary),0.3)]" rotateConfig={[-3, 4, -3]} duration={6.5} delay={3} glowId="g5" />
        </div>

        {/* SVG Mountains Layer 1 (Back) */}
        <motion.div style={{ y: mountainY1 }} className="absolute bottom-0 w-full h-[70vh] text-ethereal-primary/20">
          <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M0,600 C150,450 300,500 450,400 C600,300 750,450 900,350 C1100,200 1250,300 1440,250 L1440,600 L0,600 Z" 
              stroke="currentColor" strokeWidth="1" fill="url(#grad1)"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* SVG Mountains Layer 2 (Middle) */}
        <motion.div style={{ y: mountainY2 }} className="absolute bottom-0 w-full h-[60vh] text-ethereal-primary/30">
          <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M0,600 C200,500 350,350 550,400 C750,450 900,300 1100,350 C1250,400 1350,450 1440,400 L1440,600 L0,600 Z" 
              stroke="currentColor" strokeWidth="1.5" fill="url(#grad2)"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
            />
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* SVG Mountains Layer 3 (Front) */}
        <motion.div style={{ y: mountainY3 }} className="absolute bottom-0 w-full h-[50vh] text-ethereal-primary/50">
          <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M0,600 C300,450 500,600 750,550 C950,500 1150,550 1440,450 L1440,600 L0,600 Z" 
              stroke="currentColor" strokeWidth="2" fill="url(#grad3)"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
            />
            <defs>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full min-h-[450vh]">
        
        {/* The Ethereal Thread of Fate */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" style={{ height: '100%' }}>
          <svg viewBox="0 0 100 450" preserveAspectRatio="none" className="w-full h-full">
            {/* Deep Wide Glow */}
            <motion.path 
              d="M 50 0 C 50 80, 15 80, 15 135 C 15 170, 85 170, 85 205 C 85 240, 15 240, 15 275 C 15 310, 85 310, 85 345 C 85 380, 15 380, 15 415 C 15 435, 50 435, 50 450"
              fill="none"
              stroke="#3E3024"
              strokeWidth="6"
              className="opacity-40 blur-[10px]"
              style={{ pathLength: lineScaleY }}
            />
            {/* Mid Glow */}
            <motion.path 
              d="M 50 0 C 50 80, 15 80, 15 135 C 15 170, 85 170, 85 205 C 85 240, 15 240, 15 275 C 15 310, 85 310, 85 345 C 85 380, 15 380, 15 415 C 15 435, 50 435, 50 450"
              fill="none"
              stroke="#3E3024"
              strokeWidth="3"
              className="opacity-70 blur-[4px]"
              style={{ pathLength: lineScaleY }}
            />
            {/* Bright Inner Glow */}
            <motion.path 
              d="M 50 0 C 50 80, 15 80, 15 135 C 15 170, 85 170, 85 205 C 85 240, 15 240, 15 275 C 15 310, 85 310, 85 345 C 85 380, 15 380, 15 415 C 15 435, 50 435, 50 450"
              fill="none"
              stroke="#5A4737" /* Slightly lighter brown for inner heat */
              strokeWidth="1.5"
              className="opacity-90 blur-[1px]"
              style={{ pathLength: lineScaleY }}
            />
            {/* Core Solid Thread */}
            <motion.path 
              d="M 50 0 C 50 80, 15 80, 15 135 C 15 170, 85 170, 85 205 C 85 240, 15 240, 15 275 C 15 310, 85 310, 85 345 C 85 380, 15 380, 15 415 C 15 435, 50 435, 50 450"
              fill="none"
              stroke="#3E3024"
              strokeWidth="0.8"
              className="drop-shadow-[0_0_15px_#3E3024]"
              style={{ pathLength: lineScaleY }}
            />
          </svg>
        </div>

        {/* Hero Section */}
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="h-screen flex flex-col items-center justify-center px-6 text-center relative z-10 pointer-events-none">
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-7xl md:text-9xl lg:text-[10rem] font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight leading-none mb-4 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Tether
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}
            className="flex items-center gap-6 mb-10"
          >
            <span className="w-12 md:w-24 h-[1px] bg-gradient-to-r from-transparent to-ethereal-primary/50"></span>
            <span className="text-xl md:text-3xl text-ethereal-primary font-serif italic font-light tracking-wide drop-shadow-[0_0_15px_rgba(var(--color-primary),0.3)] whitespace-nowrap">
              Closer, despite the distance
            </span>
            <span className="w-12 md:w-24 h-[1px] bg-gradient-to-l from-transparent to-ethereal-primary/50"></span>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}
            className="text-base md:text-lg lg:text-xl text-white/80 max-w-2xl font-sans font-light mb-14 drop-shadow-md leading-relaxed mx-auto"
          >
            A beautifully private space for you and your partner to share memories, exchange letters, and listen together.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center gap-8 pointer-events-auto"
          >
            {/* Thematic Thread Button */}
            <Link to="/signup" className="group relative px-10 py-4 rounded-full overflow-hidden border border-ethereal-primary/40 bg-[#3E3024]/60 backdrop-blur-sm shadow-[0_0_20px_rgba(var(--color-primary),0.2)] hover:shadow-[0_0_40px_rgba(var(--color-primary),0.5)] hover:border-ethereal-primary transition-all duration-500">
              <div className="absolute inset-0 bg-ethereal-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-3 z-10">
                <span className="text-ethereal-primary group-hover:text-[#2a221b] font-medium text-lg tracking-widest uppercase transition-colors duration-500">Begin Journey</span>
                <svg className="w-5 h-5 text-ethereal-primary group-hover:text-[#2a221b] group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </div>
            </Link>

            {/* Secondary Minimal Button */}
            <Link to="/login" className="text-white/50 hover:text-white uppercase tracking-widest text-sm font-light transition-colors duration-300">
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature 1: Gallery */}
        <div className="min-h-[70vh] w-full flex items-center justify-end px-8 md:px-24 relative z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, margin: "-20%" }} transition={{ duration: 1, ease: "easeOut" }}
            className="w-full md:w-1/2 text-left"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-ethereal-primary mb-6 drop-shadow-[0_0_20px_rgba(var(--color-primary),0.3)]">
              A Gallery of Us
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-sans font-light leading-relaxed max-w-xl drop-shadow-md">
              Every photo, every note, every small moment collected in a shared space. Build your own digital scrapbook that grows with your relationship.
            </p>
          </motion.div>
        </div>

        {/* Feature 2: Letters */}
        <div className="min-h-[70vh] w-full flex items-center justify-start px-8 md:px-24 relative z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, margin: "-20%" }} transition={{ duration: 1, ease: "easeOut" }}
            className="w-full md:w-1/2 text-left md:text-right"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-bl from-white to-ethereal-primary mb-6 drop-shadow-[0_0_20px_rgba(var(--color-primary),0.3)]">
              Words that Last
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-sans font-light leading-relaxed max-w-xl md:ml-auto drop-shadow-md">
              Send letters that matter. Seal them, attach songs, and wait for them to be opened. Revive the romance of written words in a fast-paced digital world.
            </p>
          </motion.div>
        </div>

        {/* Feature 3: Memories */}
        <div className="min-h-[70vh] w-full flex items-center justify-end px-8 md:px-24 relative z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, margin: "-20%" }} transition={{ duration: 1, ease: "easeOut" }}
            className="w-full md:w-1/2 text-left"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-ethereal-primary mb-6 drop-shadow-[0_0_20px_rgba(var(--color-primary),0.3)]">
              Shared Memories
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-sans font-light leading-relaxed max-w-xl drop-shadow-md">
              Create a timeline of your most cherished days. From your first date to spontaneous adventures, keep your shared timeline alive and deeply personal.
            </p>
          </motion.div>
        </div>

        {/* Feature 4: Reels */}
        <div className="min-h-[70vh] w-full flex items-center justify-start px-8 md:px-24 relative z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, margin: "-20%" }} transition={{ duration: 1, ease: "easeOut" }}
            className="w-full md:w-1/2 text-left md:text-right"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-bl from-white to-ethereal-primary mb-6 drop-shadow-[0_0_20px_rgba(var(--color-primary),0.3)]">
              Relive in Motion
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-sans font-light leading-relaxed max-w-xl md:ml-auto drop-shadow-md">
              Upload short video reels to capture the laughs, the smiles, and the moments words can't describe. Experience your memories in vivid motion.
            </p>
          </motion.div>
        </div>

        {/* Feature 5: Radyo (Final CTA) */}
        <div className="min-h-[70vh] w-full flex items-center justify-end px-8 md:px-24 relative z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, margin: "-20%" }} transition={{ duration: 1, ease: "easeOut" }}
            className="w-full md:w-1/2 text-left pointer-events-auto"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-ethereal-primary mb-6 drop-shadow-[0_0_20px_rgba(var(--color-primary),0.3)]">
              Listen Together
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-sans font-light leading-relaxed max-w-xl drop-shadow-md mb-10">
              Tune into the same frequency. Share your favorite tracks and listen simultaneously with the built-in Radyo, feeling closer with every beat.
            </p>
            <Link to="/signup" className="inline-block btn-primary py-4 px-10 text-lg rounded-full font-bold shadow-[0_0_30px_rgba(var(--color-primary),0.4)] hover:shadow-[0_0_50px_rgba(var(--color-primary),0.7)] transition-all transform hover:-translate-y-1">
              Start your journey today
            </Link>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
