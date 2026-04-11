
import React from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, BadgeCheck, MessageSquareText, Zap, ArrowRight, ShieldCheck, Sparkles, Scale, BookOpen } from 'lucide-react';
import { Typewriter } from '../components/ui/typewriter';

const Home: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 space-y-32">
      {/* Hero Section */}
      <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
          <ShieldCheck size={14} />
          <span>V3.0 RAG-Powered Assistant Now Live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary leading-tight">
          Startup Legal & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
            <Typewriter
              text={[
                "Finance Assistant",
                "Compliance Partner",
                "Growth Engines",
                "Legal Guardrails"
              ]}
              speed={70}
              waitTime={1500}
              deleteSpeed={40}
              cursorChar={"_"}
            />
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          The ultimate platform to <span>{"help your startup "}</span>
          <Typewriter
            text={[
              "experience clarity",
              "scale faster",
              "master compliance",
              "focus on building",
              "succeed in India",
            ]}
            speed={70}
            className="text-emerald-500 font-bold"
            waitTime={1500}
            deleteSpeed={40}
            cursorChar={"|"}
          />
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/chat" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 group">
            Ask the Assistant
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/calendar" className="w-full sm:w-auto px-8 py-4 glass hover:bg-surface-hover text-primary rounded-2xl font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-lg">
            Compliance Calendar
          </Link>
        </div>

        {/* Core Areas Indicators */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
          <div className="flex items-center justify-center gap-2 group cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform"></div>
            Company Registration
          </div>
          <div className="flex items-center justify-center gap-2 group cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 group-hover:scale-150 transition-transform"></div>
            GST Compliance
          </div>
          <div className="flex items-center justify-center gap-2 group cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 group-hover:scale-150 transition-transform"></div>
            Funding Rules
          </div>
          <div className="flex items-center justify-center gap-2 group cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform"></div>
            Income Tax
          </div>
        </div>
      </section>

      {/* Basic Website Info & Features Grid */}
      <section className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">Everything a Founder Needs</h2>
          <p className="text-muted max-w-xl mx-auto">Our specialized tool demystifies Indian regulations so you can focus on building your business.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          <FeatureCard
            icon={MessageSquareText}
            title="Simplified AI Chat"
            description="Complex legal language explained in a founder-friendly way (Language Level 2/5)."
          />
          <FeatureCard
            icon={BadgeCheck}
            title="Verified Sources"
            description="Grounding in MCA, GST, Income Tax, and SEBI documents to prevent hallucinations."
          />
          <FeatureCard
            icon={Sparkles}
            title="Realtime Voice"
            description="Talk to our legal expert in real-time with ultra-low latency native audio processing."
          />
          <FeatureCard
            icon={BookOpen}
            title="Document Library"
            description="A curated knowledge base of official gazettes and handbooks for deep study."
          />
        </div>
      </section>

      {/* Secondary Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-primary leading-tight">Master Compliance with Our Tooling</h2>
          <div className="space-y-4">
            <FeatureListItem
              icon={Scale}
              title="Legal Guardrails"
              desc="Stay informed about FDI norms, SHA drafting, and certificate requirements."
            />
            <FeatureListItem
              icon={Zap}
              title="Semantic Search"
              desc="Find exactly what you need from thousands of regulatory pages instantly."
            />
            <FeatureListItem
              icon={ShieldCheck}
              title="Authority Citations"
              desc="Every AI response includes direct links to official government portals."
            />
          </div>
        </div>
        <div className="glass rounded-[3rem] p-8 border border-border relative overflow-hidden shadow-3xl group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-surface-hover rounded-full w-3/4"></div>
              <div className="h-4 bg-surface-hover rounded-full w-full"></div>
              <div className="h-4 bg-surface-hover rounded-full w-1/2"></div>
              <div className="pt-4 border-t border-border flex gap-2">
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">RAG ENGINE</div>
                <div className="px-4 py-2 rounded-xl bg-surface-hover text-muted text-[10px] font-bold uppercase tracking-widest">VERIFIED</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RAG Visualization */}
      <section className="glass rounded-[3rem] p-8 md:p-20 border border-border relative overflow-hidden shadow-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] -z-10"></div>

        <h2 className="text-3xl font-bold text-primary text-center mb-16 tracking-tight uppercase tracking-[0.2em]">The RAG Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
          <div className="absolute top-[24px] left-[10%] w-[80%] h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent hidden md:block"></div>

          <Step num="1" title="User Inquiry" desc="Founder asks about registration, GST, or tax exemptions." />
          <Step num="2" title="Source Retrieval" desc="System scans official gazettes using vector similarity search." />
          <Step num="3" title="Context Injection" desc="LLM processes the retrieved text to form a grounded answer." />
          <Step num="4" title="Verified Output" desc="Response is served with direct citations to original sources." />
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="text-center py-16 border-t border-border opacity-50">
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">
          ⚠️ Research Tool — Confirm with certified professionals for legal filings.
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, to }: { icon: any, title: string, description: string, to?: string }) => {
  const Card = (
    <div className="glass-card p-8 rounded-[2.5rem] border border-border flex flex-col items-start gap-4 transition-all hover:bg-surface-hover backdrop-blur-lg h-full cursor-pointer">
      <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-primary tracking-tight leading-none">{title}</h3>
      <p className="text-muted leading-relaxed text-sm">{description}</p>
    </div>
  );

  return to ? <Link to={to} className="block h-full group">{Card}</Link> : <div className="h-full group">{Card}</div>;
};

const FeatureListItem = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex gap-4 group">
    <div className="p-2 h-fit rounded-lg bg-surface-hover text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
      <Icon size={18} />
    </div>
    <div>
      <h4 className="font-bold text-primary group-hover:text-emerald-500 transition-colors">{title}</h4>
      <p className="text-sm text-muted">{desc}</p>
    </div>
  </div>
);

const Step = ({ num, title, desc }: { num: string, title: string, desc: string }) => (
  <div className="relative space-y-6 text-center group">
    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto relative z-10 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-600/30 border-4 border-background">
      {num}
    </div>
    <div className="space-y-2">
      <h4 className="text-lg font-bold text-primary">{title}</h4>
      <p className="text-xs text-muted leading-relaxed px-4">{desc}</p>
    </div>
  </div>
);

export default Home;