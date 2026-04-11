
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Receipt, Coins, Gavel, Scale, Briefcase, ShieldCheck } from 'lucide-react';

const Regulations: React.FC = () => {
  const areas = [
    {
      title: "Company Registration",
      description: "DPIIT recognition and structural compliance for Private Limited, LLP, and Partnerships.",
      icon: Building2,
      color: "emerald",
      items: ["DPIIT Recognition", "Pvt Ltd / LLP Setup", "Founders Agreement", "Digital Signature"]
    },
    {
      title: "Taxation & Exemptions",
      description: "Statutory tax benefits including Section 80-IAC holiday and Angel Tax exemptions.",
      icon: Gavel,
      color: "emerald",
      items: ["80-IAC Tax Holiday", "Angel Tax (Sec 56)", "Statutory Audit", "Income Tax (ITR-6)"]
    },
    {
      title: "GST Compliance",
      description: "Registration and recurring filings for GSTR-1, 3B, and E-invoicing requirements.",
      icon: Receipt,
      color: "green",
      items: ["GSTR-1 & 3B Filings", "GSTR-9 Exemption", "E-Invoicing Rules", "Input Tax Credit"]
    },
    {
      title: "IP Protection",
      description: "Safeguard your innovations with trademark, patent, and industrial design registrations.",
      icon: ShieldCheck,
      color: "blue",
      items: ["Trademark (TM Act)", "Patent (SIPP Scheme)", "Copyright Filing", "Industrial Design"]
    },
    {
      title: "Funding & FDI",
      description: "Regulatory norms for equity rounds, FEMA compliance, and SEBI AIF regulations.",
      icon: Coins,
      color: "teal",
      items: ["FEMA/FDI Norms", "SEBI AIF Rules", "Term Sheet Review", "SHA Drafting"]
    },
    {
      title: "Labor & Data Privacy",
      description: "Compliance with Digital Personal Data Protection (DPDP) Act 2023 and Labor laws.",
      icon: Briefcase,
      color: "indigo",
      items: ["DPDP Act 2023", "PF/ESI Registration", "POSH Policy", "ESOP Structuring"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-primary">Startup Compliance Areas</h1>
        <p className="text-muted max-w-2xl">
          Detailed breakdowns of major regulatory domains for startups. Explore deep-dives into specific requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {areas.map((area, i) => (
          <div key={i} className="glass p-8 rounded-[2rem] border-border/50 group hover:border-emerald-500/30 transition-all flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className={`shrink-0 w-12 h-12 rounded-2xl bg-surface flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform`}>
                <area.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-primary leading-tight pt-2">{area.title}</h3>
            </div>

            <div className="space-y-4 flex flex-col flex-grow">
              <p className="text-muted text-sm leading-relaxed line-clamp-2">{area.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {area.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-muted font-medium">
                    <div className="shrink-0 w-1 h-1 rounded-full bg-emerald-500/60"></div>
                    {item}
                  </div>
                ))}
              </div>

              <div className="pt-6 mt-auto">
                <Link to="/documents" className="w-full text-center px-6 py-3 rounded-xl bg-surface border border-border text-primary text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all inline-block">
                  View Full Guidance
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Regulations;