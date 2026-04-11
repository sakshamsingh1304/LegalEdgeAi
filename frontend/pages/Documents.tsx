import React, { useState, useEffect } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import { EvervaultCard, Icon } from '../components/ui/evervault-card';

interface DocumentData {
  id: string;
  title: string;
  tag: string;
  meta: string;
  description: string;
  image: string;
  url: string;
  file_name?: string;
  upload_date?: string;
  match_count?: number;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [urlDate, setUrlDate] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');
    if (date) {
      setUrlDate(date);
    }
  }, [window.location.search]);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        let url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/documents`;
        if (searchQuery.trim()) {
          url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/search?q=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchDocuments, searchQuery ? 400 : 0);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const filteredDocuments = documents.filter(doc => {
    const matchesDate = urlDate ? doc.upload_date === urlDate : true;
    return matchesDate;
  });

  const clearFilters = () => {
    window.history.pushState({}, '', window.location.pathname);
    setUrlDate(null);
    setSearchQuery('');
  };

  return (
    <div className="py-20 min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-6 mb-12 space-y-6">
        <h1 className="text-3xl font-bold text-primary mb-8">Official Compliance Knowledge Base</h1>

        <div className="flex flex-col md:flex-row gap-6 md:items-center">
          <div className="relative w-full group max-w-2xl">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search legal guides, forms, or acts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-surface border border-border rounded-2xl text-primary focus:outline-none focus:border-emerald-500/50 transition-all text-lg placeholder:text-muted"
              />
            </div>
          </div>

          {urlDate && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20 transition-all"
            >
              <X size={14} />
              Updates for {new Date(urlDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading documents...</div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="relative group h-full">
                <div className="glass flex flex-col items-start p-8 relative min-h-[34rem] h-full overflow-hidden rounded-[2rem] border-border/50 transition-all duration-300 hover:border-emerald-500/30">
                  <div className="w-full h-56 shrink-0 mb-8 relative group/card-wrapper rounded-[2rem] overflow-hidden">
                    <EvervaultCard text={doc.title} className="hover:cursor-none h-full" />
                  </div>

                  <div className="flex flex-col flex-grow w-full gap-4">
                    <div className="space-y-2">
                      <h2 className="text-primary text-xl font-bold group-hover:text-emerald-500 transition-colors leading-tight">
                        {doc.title}
                      </h2>

                      {searchQuery && doc.match_count !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            {doc.match_count} Matches
                          </div>
                          <span className="text-[10px] text-muted font-medium italic">Found in content</span>
                        </div>
                      )}
                    </div>

                    <p className="text-muted text-sm leading-relaxed line-clamp-3">
                      {doc.description}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-6 border-t border-border/50 w-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-0.5 font-medium w-fit">
                          {doc.tag}
                        </span>
                        {doc.upload_date && (
                          <span className="text-[9px] text-muted pl-1 uppercase font-bold tracking-tighter">Uploaded: {doc.upload_date}</span>
                        )}
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs border font-medium border-border/50 rounded-full text-primary px-5 py-2.5 bg-surface hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center gap-2 group/btn"
                      >
                        View Document
                        <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-muted">
              No documents found.
              {urlDate && (
                <button onClick={clearFilters} className="block mx-auto mt-4 text-emerald-500 font-bold hover:underline">
                  Clear date filter
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Documents;
