import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Play, ArrowRight, Image as ImageIcon, 
  Film, User, Layers, Clapperboard, Settings2,
  Maximize2
} from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }
};

function Navigation() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(scrollY, [0, 50], ["rgba(17,19,24,0)", "rgba(17,19,24,0.8)"]);
  const borderBottomColor = useTransform(scrollY, [0, 50], ["rgba(31,37,50,0)", "rgba(31,37,50,1)"]);
  
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 px-6 h-16 flex items-center justify-between backdrop-blur-md"
      style={{ backgroundColor, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor }}
    >
      <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <Layers className="w-3 h-3 text-primary-foreground" />
        </div>
        Flows
      </div>
      <Link href="/canvas" className="text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-full transition-colors">
        Open Canvas
      </Link>
    </motion.nav>
  );
}

function HeroSection() {
  const isReducedMotion = useReducedMotion();
  
  return (
    <section className="relative min-h-[100dvh] w-full flex items-center pt-20 overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {!isReducedMotion && (
          <>
            <div className="absolute top-[20%] left-[10%] bg-card border border-border p-2 rounded-md animate-float flex items-center gap-2 shadow-lg">
              <User className="w-4 h-4 text-emerald-500" /> <span className="text-xs">Character</span>
            </div>
            <div className="absolute top-[60%] left-[5%] bg-card border border-border p-2 rounded-md animate-float flex items-center gap-2 shadow-lg" style={{ animationDelay: '1s' }}>
              <Film className="w-4 h-4 text-purple-500" /> <span className="text-xs">LTX Pro</span>
            </div>
            <div className="absolute top-[15%] right-[15%] bg-card border border-border p-2 rounded-md animate-float flex items-center gap-2 shadow-lg" style={{ animationDelay: '2s' }}>
              <Clapperboard className="w-4 h-4 text-orange-500" /> <span className="text-xs">Director</span>
            </div>
            <div className="absolute bottom-[20%] right-[10%] bg-card border border-border p-2 rounded-md animate-float flex items-center gap-2 shadow-lg" style={{ animationDelay: '1.5s' }}>
              <ImageIcon className="w-4 h-4 text-blue-500" /> <span className="text-xs">Image Gen</span>
            </div>
          </>
        )}
      </div>

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="max-w-2xl"
        >
          <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Build AI video workflows. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Visually.</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg lg:text-xl text-muted-foreground mb-8">
            Connect a prompt to an image generator, feed it into a video model, and add post-processing in one unified canvas.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            <Link href="/canvas" className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 shadow-lg shadow-primary/20">
              Open Canvas <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <button className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-transparent border border-border text-foreground font-medium transition-colors hover:bg-muted">
              <Play className="mr-2 w-4 h-4" /> Watch Demo
            </button>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full aspect-square md:aspect-video lg:aspect-square bg-card rounded-xl border border-border p-6 shadow-2xl flex flex-col items-center justify-center overflow-hidden"
        >
           <div className="flex flex-col gap-4 items-center w-full max-w-sm relative z-10">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1 }}
               className="bg-background border border-border p-3 rounded-lg flex items-center gap-3 w-full shadow-md"
             >
               <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center"><Settings2 className="w-4 h-4 text-slate-400" /></div>
               <div className="flex-1"><div className="h-2 w-16 bg-muted rounded mb-2"></div><div className="h-2 w-24 bg-muted rounded"></div></div>
             </motion.div>

             <motion.div 
               initial={{ height: 0 }}
               animate={{ height: 24 }}
               transition={{ delay: 1.5 }}
               className="w-px border-l-2 border-dashed border-primary/50"
             />

             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1.8 }}
               className="bg-background border border-border p-3 rounded-lg flex items-center gap-3 w-full shadow-md"
             >
               <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center"><Film className="w-4 h-4 text-purple-400" /></div>
               <div className="flex-1"><div className="h-2 w-20 bg-muted rounded mb-2"></div><div className="h-2 w-16 bg-muted rounded"></div></div>
             </motion.div>

             <motion.div 
               initial={{ height: 0 }}
               animate={{ height: 24 }}
               transition={{ delay: 2.3 }}
               className="w-px border-l-2 border-dashed border-primary/50"
             />

             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 2.8 }}
               className="w-full aspect-video bg-muted rounded-lg border border-border relative overflow-hidden flex items-center justify-center group"
             >
               <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay"></div>
               <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent"></div>
               <Play className="w-8 h-8 text-foreground/50 group-hover:text-foreground transition-colors" />
             </motion.div>
           </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      if (v < 0.33) setActiveStep(0);
      else if (v < 0.66) setActiveStep(1);
      else setActiveStep(2);
    });
  }, [scrollYProgress]);

  return (
    <section ref={containerRef} className="py-24 w-full bg-background relative">
      <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 h-[50vh] lg:h-[80vh] sticky top-[10vh] rounded-xl border border-border bg-card overflow-hidden flex items-center justify-center p-6 shadow-xl">
          <AnimatePresence mode="wait">
            {activeStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex gap-4">
                <div className="bg-background border border-border p-4 rounded-lg flex items-center gap-3"><ImageIcon className="w-5 h-5 text-blue-500"/><span>Image Upload</span></div>
                <div className="bg-background border border-border p-4 rounded-lg flex items-center gap-3"><Settings2 className="w-5 h-5 text-slate-400"/><span>Prompt</span></div>
              </motion.div>
            )}
            {activeStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
                <div className="flex gap-4">
                  <div className="bg-background border border-border p-4 rounded-lg flex items-center gap-3 opacity-70"><ImageIcon className="w-5 h-5 text-blue-500"/></div>
                  <div className="bg-background border border-border p-4 rounded-lg flex items-center gap-3 opacity-70"><Settings2 className="w-5 h-5 text-slate-400"/></div>
                </div>
                <div className="h-8 w-px border-l-2 border-dashed border-muted-foreground" />
                <div className="bg-background border border-primary p-4 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(79,110,247,0.2)]"><Clapperboard className="w-5 h-5 text-orange-500"/><span>Director Node</span></div>
              </motion.div>
            )}
            {activeStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
                <div className="bg-background border border-border p-4 rounded-lg flex items-center gap-3 opacity-50"><Clapperboard className="w-5 h-5 text-orange-500"/><span>Director Node</span></div>
                <div className="h-8 w-px border-l-2 border-dashed border-primary" />
                <div className="bg-background border border-purple-500/50 p-4 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.3)]"><Film className="w-5 h-5 text-purple-400"/><span>LTX Pro Video</span></div>
                <div className="mt-4 w-48 aspect-video bg-muted rounded border border-border overflow-hidden relative">
                  <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/20"></div>
                  <div className="absolute bottom-0 left-0 h-1 bg-primary w-full animate-marquee"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center py-[10vh] gap-32">
          {[
            {
              num: "01", title: "Upload your reference",
              desc: "Add images, video clips, or audio as starting points for your pipeline."
            },
            {
              num: "02", title: "Build your workflow",
              desc: "Connect AI nodes — Director, Character, Image Gen, Video — into any pipeline you need."
            },
            {
              num: "03", title: "Generate and iterate",
              desc: "Run the workflow. Every node processes in sequence. Swap models, adjust prompts, regenerate."
            }
          ].map((step, i) => (
            <div key={i} className={`transition-opacity duration-500 ${activeStep === i ? "opacity-100" : "opacity-30"}`}>
              <div className="text-primary font-mono text-xl mb-4">{step.num}</div>
              <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
              <p className="text-xl text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DirectorSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1 relative rounded-xl border border-border bg-card p-6 shadow-2xl h-[400px] flex flex-col">
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
            <Clapperboard className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-sm">Director Agent</h3>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-background border border-border rounded-md p-3 font-mono text-sm text-foreground/80 h-24 relative overflow-hidden">
              cinematic chase sequence through a neon-lit city at night...
              <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-2 h-4 bg-primary align-middle ml-1"
              />
            </div>
            <div className="flex justify-end">
              <motion.button 
                animate={{ boxShadow: ['0 0 0 0 rgba(79,110,247,0)', '0 0 15px 2px rgba(79,110,247,0.3)', '0 0 0 0 rgba(79,110,247,0)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
              >
                Build Workflow
              </motion.button>
            </div>
            <div className="mt-auto border-t border-border pt-4">
              <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Preview</div>
              <div ref={ref} className="flex items-center gap-2 overflow-hidden">
                <AnimatePresence>
                  {isInView && ['Director', 'Character', 'LTX', 'Upscale'].map((node, i) => (
                    <React.Fragment key={node}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="bg-background border border-border px-3 py-1.5 rounded text-xs whitespace-nowrap"
                      >
                        {node}
                      </motion.div>
                      {i < 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.15 + 0.1 }}
                        >
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </motion.div>
                      )}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-4xl font-bold mb-6">Director AI</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Describe your vision. Get a full workflow.
            <br/><br/>
            Type what you want to create. The Director agent designs the entire node pipeline for you — choosing the right models, connecting them in the correct order, and placing them on the canvas.
          </p>
          <Link href="/canvas" className="text-primary font-medium hover:underline inline-flex items-center">
            Open Canvas <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, desc, visual }: { title: string, desc: string, visual: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  return (
    <div ref={ref} className="bg-card border border-border rounded-xl overflow-hidden hover-elevate transition-all duration-300 group">
      <div className="h-48 bg-muted/50 border-b border-border p-4 relative overflow-hidden flex items-center justify-center">
        {isInView && visual}
      </div>
      <div className="p-6">
        <h4 className="text-xl font-semibold mb-2">{title}</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FeatureGridSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          
          <FeatureCard 
            title="Image to Video"
            desc="Feed any reference image into LTX-2.3 Pro. Get a cinematic clip in seconds."
            visual={
              <div className="w-full max-w-sm h-32 rounded-md overflow-hidden relative flex bg-background border border-border">
                <div className="w-1/2 h-full bg-slate-900 relative">
                  <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay"></div>
                </div>
                <div className="w-1/2 h-full relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900"></div>
                   <motion.div 
                     initial={{ top: "-10%" }}
                     animate={{ top: "110%" }}
                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     className="absolute left-0 right-0 h-1 bg-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                   />
                </div>
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border group-hover:left-[80%] transition-all duration-700 ease-in-out" />
              </div>
            }
          />
          
          <FeatureCard 
            title="Character Consistency"
            desc="Lock in a reference once. Every generated scene maintains your character's appearance."
            visual={
              <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
                {[0,1,2,3].map((i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.15, type: 'spring' }}
                    className="aspect-square rounded border border-border bg-slate-900 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500" />
                  </motion.div>
                ))}
              </div>
            }
          />
          
          <FeatureCard 
            title="Batch Workflows"
            desc="Run one prompt across multiple images, styles, or scenes simultaneously."
            visual={
              <div className="relative w-48 h-32 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {[0,1,2].map((i) => (
                  <motion.div 
                    key={i}
                    className="absolute inset-0 rounded-md border border-border bg-card shadow-lg"
                    style={{ zIndex: 3 - i }}
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    whileHover={{ 
                      x: i === 0 ? -30 : i === 2 ? 30 : 0, 
                      y: i === 0 ? -10 : i === 2 ? 10 : 0,
                      rotate: i === 0 ? -5 : i === 2 ? 5 : 0 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className={`w-full h-full bg-gradient-to-br ${i === 0 ? 'from-blue-900' : i === 1 ? 'from-purple-900' : 'from-emerald-900'} opacity-40 rounded-md`} />
                  </motion.div>
                ))}
              </div>
            }
          />
          
          <FeatureCard 
            title="One-click Enhancement"
            desc="Remove backgrounds, upscale resolution, extend duration — pipeline any post-processing step."
            visual={
              <div className="w-full max-w-sm h-32 rounded-md overflow-hidden relative bg-slate-900 border border-border group-hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay filter blur-[1px]"></div>
                <motion.div 
                  className="absolute inset-0 overflow-hidden"
                  initial={{ width: '0%' }}
                  animate={{ width: '50%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  <div className="w-[400px] h-full bg-gradient-to-r from-blue-900/50 to-transparent"></div>
                  <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay"></div>
                </motion.div>
                <motion.div 
                  className="absolute top-0 bottom-0 bg-primary w-0.5 shadow-[0_0_8px_rgba(79,110,247,0.8)]"
                  initial={{ left: '0%' }}
                  animate={{ left: '50%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                </motion.div>
              </div>
            }
          />
          
        </div>
      </div>
    </section>
  );
}

const TEMPLATES = [
  { name: "Image to Video", color: "from-blue-500/20" },
  { name: "Consistent Character", color: "from-orange-500/20" },
  { name: "Upscale & Enhance", color: "from-emerald-500/20" },
  { name: "Text to Video Batch", color: "from-purple-500/20" },
  { name: "Lip Sync Dubbing", color: "from-pink-500/20" },
  { name: "Director Storyboard", color: "from-indigo-500/20" },
];

function TemplateGallerySection() {
  return (
    <section className="py-24 bg-card border-y border-border overflow-hidden">
      <div className="container mx-auto px-6 text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">16 ready-made workflows</h2>
        <p className="text-muted-foreground">Start from a proven template. Customize it. Ship it.</p>
      </div>

      <div className="flex relative w-full overflow-hidden group">
        <div className="flex gap-6 w-max animate-marquee">
          {[...TEMPLATES, ...TEMPLATES].map((tpl, i) => (
            <div key={i} className="w-[180px] h-[220px] rounded-xl border border-border bg-background relative overflow-hidden flex flex-col transition-transform hover:scale-105 hover:border-primary/50 cursor-pointer flex-shrink-0">
              <div className={`absolute inset-0 bg-gradient-to-b ${tpl.color} to-transparent opacity-20`} />
              <div className="flex-1 p-4 flex flex-col justify-center items-center gap-2 relative z-10">
                <div className="w-12 h-4 rounded bg-muted/80"></div>
                <div className="w-px h-4 border-l border-border"></div>
                <div className="w-12 h-4 rounded bg-muted/80"></div>
                <div className="w-px h-4 border-l border-border"></div>
                <div className="w-12 h-4 rounded bg-muted/80"></div>
              </div>
              <div className="p-3 border-t border-border bg-card/50 backdrop-blur text-sm font-medium text-center relative z-10">
                {tpl.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <button className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-transparent border border-border text-foreground font-medium transition-colors hover:bg-muted">
          Browse all templates
        </button>
      </div>
    </section>
  );
}

const NODES = [
  { name: 'Upload', color: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-500', icon: ImageIcon },
  { name: 'Director', color: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-500', icon: Clapperboard },
  { name: 'Character', color: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-500', icon: User },
  { name: 'LTX Pro', color: 'border-purple-500', bg: 'bg-purple-500', text: 'text-purple-500', icon: Film },
  { name: 'Upscale', color: 'border-slate-400', bg: 'bg-slate-400', text: 'text-slate-400', icon: Maximize2 },
];

function WorkflowVisSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-32 bg-background relative overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6 text-center mb-16 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Every creative pipeline. One canvas.</h2>
      </div>

      <div className="w-full overflow-x-auto pb-12 hide-scrollbar">
        <div className="min-w-[1000px] max-w-[1200px] mx-auto flex items-center justify-between px-6 relative">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const isLast = i === NODES.length - 1;
            
            return (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.15, duration: 0.5, type: 'spring' }}
                  className={`w-[160px] h-[100px] bg-card rounded-lg border-2 ${node.color} flex flex-col p-4 relative z-10 shadow-lg`}
                >
                  <div className="flex items-center gap-2 mb-auto">
                    <Icon className={`w-4 h-4 ${node.text}`} />
                    <span className="text-sm font-semibold">{node.name}</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-muted rounded overflow-hidden">
                    <motion.div 
                      className={`h-full ${node.bg}`}
                      initial={{ width: '0%' }}
                      animate={isInView ? { width: '100%' } : {}}
                      transition={{ delay: 1 + i * 0.5, duration: 0.5 }}
                    />
                  </div>

                  {isInView && (
                     <motion.div
                       className={`absolute inset-0 rounded-lg shadow-[0_0_20px_2px_currentColor] opacity-0 ${node.text}`}
                       animate={{ opacity: [0, 0.8, 0] }}
                       transition={{ delay: 1 + i * 0.5, duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
                     />
                  )}
                </motion.div>

                {!isLast && (
                  <div className="flex-1 h-px bg-muted relative mx-2">
                    <motion.div 
                      className={`absolute top-0 left-0 h-full ${node.bg}`}
                      initial={{ width: '0%' }}
                      animate={isInView ? { width: '100%' } : {}}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.3 }}
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </section>
  );
}

function CountUp({ to }: { to: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const interval = 20;
    const steps = duration / interval;
    const stepValue = to / steps;
    
    const timer = setInterval(() => {
      start += stepValue;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [to]);
  
  return <>{count}</>;
}

function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  return (
    <section ref={ref} className="py-24 border-y border-border bg-card/30">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div>
          <div className="text-6xl font-bold mb-2 text-primary font-mono">
            {isInView ? <CountUp to={18} /> : "0"}
          </div>
          <div className="text-muted-foreground uppercase tracking-widest text-sm">Node Types</div>
        </div>
        <div>
          <div className="text-6xl font-bold mb-2 text-primary font-mono">
             {isInView ? <CountUp to={16} /> : "0"}
          </div>
          <div className="text-muted-foreground uppercase tracking-widest text-sm">Templates</div>
        </div>
        <div>
          <div className="text-6xl font-bold mb-2 text-primary font-mono">1</div>
          <div className="text-muted-foreground uppercase tracking-widest text-sm">Canvas</div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-32 relative overflow-hidden bg-background">
       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />
       
       <div className="container mx-auto px-6 text-center relative z-10 max-w-2xl">
         <h2 className="text-5xl font-bold mb-6">Start building.</h2>
         <p className="text-xl text-muted-foreground mb-10">Your AI video workflow, in minutes.</p>
         
         <Link href="/canvas" className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-primary text-primary-foreground font-medium text-lg transition-colors hover:bg-primary/90 shadow-[0_0_30px_rgba(79,110,247,0.3)] hover:scale-105 transform duration-200">
           Open Canvas <ArrowRight className="ml-2 w-5 h-5" />
         </Link>
       </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 border-t border-border bg-card/50 text-center text-sm text-muted-foreground">
       <div className="container mx-auto px-6">
         &copy; {new Date().getFullYear()} Flows. All rights reserved.
       </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/30 font-sans">
      <Navigation />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <DirectorSection />
        <FeatureGridSection />
        <TemplateGallerySection />
        <WorkflowVisSection />
        <StatsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
