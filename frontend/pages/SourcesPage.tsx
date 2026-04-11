import React from 'react';
import { ShieldCheck, Info, ExternalLink, Library, Building2, Landmark, Calculator, Rocket } from 'lucide-react';

const SourcesPage: React.FC = () => {
  const categories = [
    {
      title: "Corporate & Legal Framework",
      icon: <Building2 className="text-blue-400" size={24} />,
      sources: [
        {
          name: "Ministry of Corporate Affairs (MCA)",
          description: "Official repository for Company Law, LLP Act, and regulatory filings.",
          url: "https://www.mca.gov.in"
        },
        {
          name: "India Code (Legislative Department)",
          description: "Digital repository of all Central and State Acts.",
          url: "https://www.indiacode.nic.in"
        }
      ]
    },
    {
      title: "Taxation & Compliance",
      icon: <Calculator className="text-emerald-400" size={24} />,
      sources: [
        {
          name: "Income Tax Department",
          description: "Direct tax laws, TDS rates, and assessment procedures.",
          url: "https://www.incometax.gov.in"
        },
        {
          name: "GST Council / CBIC",
          description: "Goods & Services Tax notifications, circulars, and tariff acts.",
          url: "https://www.gst.gov.in"
        }
      ]
    },
    {
      title: "Finance & Banking",
      icon: <Landmark className="text-purple-400" size={24} />,
      sources: [
        {
          name: "Reserve Bank of India (RBI)",
          description: "FEMA regulations, monetary policies, and banking ombudsman.",
          url: "https://rbi.org.in"
        },
        {
          name: "SEBI",
          description: "Regulations for capital markets, AIFs, and listing obligations.",
          url: "https://www.sebi.gov.in"
        }
      ]
    },
    {
      title: "Startups & Intellectual Property",
      icon: <Rocket className="text-orange-400" size={24} />,
      sources: [
        {
          name: "Startup India / DPIIT",
          description: "Startup recognition, tax exemptions (80-IAC), and fund of funds.",
          url: "https://www.startupindia.gov.in"
        },
        {
          name: "IP India (Patents & Designs)",
          description: "Intellectual property rights, patent filings, and trademark registry.",
          url: "https://ipindia.gov.in"
        }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 ring-1 ring-emerald-500/30 mb-2">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-muted pb-2">
          Trusted Regulatory Sources
        </h1>
        <p className="text-muted text-xl leading-relaxed">
          Our AI Intelligence is strictly grounded in official government gazettes, acts, and notifications.
          We prioritize <span className="text-emerald-500 font-semibold">accuracy over creativity</span> when it comes to compliance.
        </p>
      </div>

      {/* Methodology Card */}
      <div className="glass p-8 md:p-10 rounded-[2.5rem] border-border bg-gradient-to-b from-surface to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 blur-[100px] rounded-full w-64 h-64 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
          <div className="p-4 rounded-3xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
            <Library size={32} />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">The RAG Engine (Retrieval Augmented Generation)</h3>
            <p className="text-primary/80 text-lg leading-relaxed">
              When you ask a legal or financial question, our system doesn't just "guess".
              It actively scans thousands of pages of indexed documents from the sources below.
              It retrieves the exact relevant clause or section and uses it to construct your answer, citing the source.
            </p>
            <div className="flex gap-3 pt-2">
              <span className="px-3 py-1 rounded-full bg-surface border border-border text-xs text-muted">Zero Hallucination Policy</span>
              <span className="px-3 py-1 rounded-full bg-surface border border-border text-xs text-muted">Real-time Citations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <div key={idx} className="glass rounded-[2rem] border-border/40 p-8 hover:border-emerald-500/20 transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-surface border border-border group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold text-primary">{cat.title}</h3>
            </div>

            <div className="space-y-4">
              {cat.sources.map((source, sIdx) => (
                <div key={sIdx} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-surface hover:bg-surface-hover border border-border/50 hover:border-border transition-all group/item">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-primary/90 text-sm">{source.name}</h4>
                    <p className="text-xs text-muted leading-relaxed">{source.description}</p>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-surface-strong/20 text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-center max-w-2xl mx-auto pb-10">
        <div className="inline-flex items-center gap-2 text-sm text-muted bg-surface px-4 py-2 rounded-full border border-border">
          <Info size={16} />
          <span>Information is for guidance only. Always consult a professional for critical decisions.</span>
        </div>
      </div>
    </div>
  );
};

export default SourcesPage;