'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { ALL_COUNTRY_CODES, CountryCodeOption } from '@/lib/phone-utils';

interface CountryCodeSelectorProps {
  value: string; // Dial code e.g. "+91" or ISO e.g. "IN"
  onChange: (country: CountryCodeOption) => void;
  disabled?: boolean;
  className?: string;
}

export function CountryCodeSelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected country
  const selectedCountry =
    ALL_COUNTRY_CODES.find(
      (c) => c.code === value || c.iso.toLowerCase() === value.toLowerCase()
    ) || ALL_COUNTRY_CODES[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter countries by query (name, dial code, or ISO)
  const query = searchQuery.trim().toLowerCase().replace('+', '');
  const filteredCountries = ALL_COUNTRY_CODES.filter((c) => {
    if (!query) return true;
    const matchName = c.name.toLowerCase().includes(query);
    const matchCode = c.code.replace('+', '').includes(query);
    const matchIso = c.iso.toLowerCase().includes(query);
    return matchName || matchCode || matchIso;
  });

  const handleSelect = (country: CountryCodeOption) => {
    onChange(country);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Country Calling Code"
        aria-expanded={isOpen}
        className="h-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] focus:border-[#0099e6] dark:focus:border-[#38bdf8] text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 select-none"
      >
        <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
          {selectedCountry.flag}
        </span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {selectedCountry.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0099e6] dark:text-[#38bdf8]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or code..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#0099e6] dark:focus:border-[#38bdf8] transition-colors"
            />
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No country found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.iso === selectedCountry.iso;
                return (
                  <button
                    key={`${country.iso}-${country.code}`}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0099e6]/10 text-[#0099e6] dark:text-[#38bdf8] font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0 leading-none">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        {country.code}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
