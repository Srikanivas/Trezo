import React, { useState, useEffect, useRef } from "react";
import { companyAPI, CompanySearchResult } from "../../services/api";
import { Search, X } from "lucide-react";

interface Props {
  onSelect: (company: CompanySearchResult) => void;
  selected: CompanySearchResult | null;
  onClear: () => void;
}

const CompanySearchInput: React.FC<Props> = ({ onSelect, selected, onClear }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await companyAPI.search(query);
        if (res.success && res.data) {
          setResults(res.data);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between px-3 py-2 border border-indigo-300 rounded-lg bg-indigo-50">
        <span className="text-sm font-medium text-indigo-800">{selected.company_name}</span>
        <button onClick={onClear} className="text-indigo-400 hover:text-indigo-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company name..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">...</span>}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((c) => (
            <li
              key={c.id}
              onClick={() => {
                onSelect(c);
                setQuery("");
                setOpen(false);
              }}
              className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
            >
              {c.company_name}
            </li>
          ))}
        </ul>
      )}
      {open && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
          No companies found
        </div>
      )}
    </div>
  );
};

export default CompanySearchInput;
