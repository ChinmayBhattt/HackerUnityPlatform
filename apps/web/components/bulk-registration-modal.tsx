'use client';

import { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Users,
  Sparkles,
} from 'lucide-react';
import { EventRegistration, bulkSaveEventRegistrations } from '@/lib/storage';

interface BulkRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  onSuccess: (count: { added: number; updated: number; total: number }) => void;
}

interface ParsedCandidate {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  city?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  status: 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'REJECTED';
  valid: boolean;
  error?: string;
}

export function BulkRegistrationModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  onSuccess,
}: BulkRegistrationModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [defaultStatus, setDefaultStatus] = useState<'APPROVED' | 'PENDING' | 'CONFIRMED'>('APPROVED');
  const [parsedRows, setParsedRows] = useState<ParsedCandidate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Split line respecting double quotes
  const parseCSVRow = (text: string, delimiter: string = ','): string[] => {
    const row: string[] = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    return row;
  };

  const parseRawContent = (content: string) => {
    setParseError(null);
    const cleaned = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!cleaned) {
      setParsedRows([]);
      return;
    }

    const lines = cleaned.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';

    const headerRow = parseCSVRow(lines[0], delimiter).map((h) =>
      h.replace(/^["']|["']$/g, '').trim().toLowerCase()
    );

    // Map column indices
    const findIndex = (keywords: string[]) =>
      headerRow.findIndex((h) => keywords.some((k) => h === k || h.includes(k)));

    const nameIdx = findIndex(['name', 'applicant', 'candidate', 'full name', 'fullname', 'user']);
    const emailIdx = findIndex(['email', 'mail', 'e-mail']);
    const phoneIdx = findIndex(['phone', 'mobile', 'contact', 'whatsapp', 'cell']);
    const collegeIdx = findIndex(['college', 'university', 'institution', 'institute', 'school']);
    const cityIdx = findIndex(['city', 'location', 'state', 'town']);
    const githubIdx = findIndex(['github', 'gh', 'git']);
    const linkedinIdx = findIndex(['linkedin', 'li']);
    const skillsIdx = findIndex(['skills', 'skill', 'tech', 'stack', 'technologies']);
    const statusIdx = findIndex(['status', 'state']);

    // Check if first row is actually a header
    const hasHeader = emailIdx !== -1 || nameIdx !== -1;
    const startIndex = hasHeader ? 1 : 0;

    const results: ParsedCandidate[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const values = parseCSVRow(lines[i], delimiter).map((v) =>
        v.replace(/^["']|["']$/g, '').trim()
      );

      if (values.every((v) => !v)) continue;

      let email = '';
      let name = '';
      let phone = '';
      let college = '';
      let city = '';
      let githubUrl = '';
      let linkedinUrl = '';
      let skills: string[] = [];
      let rowStatus = defaultStatus;

      if (hasHeader) {
        email = emailIdx !== -1 ? values[emailIdx] || '' : '';
        name = nameIdx !== -1 ? values[nameIdx] || '' : '';
        phone = phoneIdx !== -1 ? values[phoneIdx] || '' : '';
        college = collegeIdx !== -1 ? values[collegeIdx] || '' : '';
        city = cityIdx !== -1 ? values[cityIdx] || '' : '';
        githubUrl = githubIdx !== -1 ? values[githubIdx] || '' : '';
        linkedinUrl = linkedinIdx !== -1 ? values[linkedinIdx] || '' : '';
        if (skillsIdx !== -1 && values[skillsIdx]) {
          skills = values[skillsIdx]
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (statusIdx !== -1 && values[statusIdx]) {
          const sVal = values[statusIdx].toUpperCase();
          if (['APPROVED', 'PENDING', 'CONFIRMED', 'REJECTED'].includes(sVal)) {
            rowStatus = sVal as any;
          }
        }
      } else {
        // Fallback positional indexing: Name, Email, Phone, College, City, Skills
        name = values[0] || '';
        email = values[1] || '';
        phone = values[2] || '';
        college = values[3] || '';
        city = values[4] || '';
        if (values[5]) {
          skills = values[5].split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
        }
      }

      // Basic validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);
      let isValid = true;
      let error = '';

      if (!email) {
        isValid = false;
        error = 'Missing email address';
      } else if (!isValidEmail) {
        isValid = false;
        error = 'Invalid email format';
      }

      if (isValid && !name) {
        // Derive name from email prefix if omitted
        name = email.split('@')[0];
      }

      results.push({
        name,
        email,
        phone,
        college,
        city,
        githubUrl,
        linkedinUrl,
        skills,
        status: rowStatus,
        valid: isValid,
        error,
      });
    }

    if (results.length === 0) {
      setParseError('No rows could be identified. Please ensure the CSV contains data.');
    }

    setParsedRows(results);
  };

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseRawContent(text);
    };
    reader.onerror = () => {
      setParseError('Failed to read the file. Please check file format.');
    };
    reader.readAsText(uploadedFile);
  };

  const handlePasteChange = (text: string) => {
    setPastedText(text);
    parseRawContent(text);
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'Name,Email,Phone,College,City,GitHub,LinkedIn,Skills,Status\n' +
      'Aarav Sharma,aarav.sharma@example.com,+91 9876543210,IIT Bombay,Mumbai,https://github.com/aarav,https://linkedin.com/in/aarav,"Next.js, TypeScript, Python",APPROVED\n' +
      'Priya Patel,priya.patel@example.com,+91 9876543211,BITS Pilani,Goa,https://github.com/priya,https://linkedin.com/in/priya,"React, Tailwind, Node.js",PENDING\n' +
      'Rohan Verma,rohan.v@example.com,+91 9876543212,DTU,Delhi,https://github.com/rohan,https://linkedin.com/in/rohan,"Solidity, Rust, Go",CONFIRMED\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hackers_unity_registration_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    const validCandidates = parsedRows.filter((r) => r.valid);
    if (validCandidates.length === 0) return;

    setIsProcessing(true);

    const newRegistrations: EventRegistration[] = validCandidates.map((c, index) => ({
      id: `reg_bulk_${Date.now()}_${index}`,
      eventId,
      userId: `user_bulk_${Date.now()}_${index}`,
      userName: c.name,
      userEmail: c.email,
      phone: c.phone,
      college: c.college,
      city: c.city,
      githubUrl: c.githubUrl,
      linkedinUrl: c.linkedinUrl,
      skills: c.skills,
      status: c.status || defaultStatus,
      registeredAt: new Date().toISOString(),
    }));

    const result = bulkSaveEventRegistrations(eventId, newRegistrations);

    setIsProcessing(false);
    onSuccess(result);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0099e6] border border-blue-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Bulk Importer
              </span>
              <span className="text-xs text-slate-400 font-mono">CSV / TSV / Excel</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Bulk Upload Registrations
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Import participant data in bulk for <strong className="text-slate-800">{eventName}</strong>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Sample template banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Need the correct column format?</h4>
                <p className="text-[11px] text-slate-500">
                  Headers supported: Name, Email, Phone, College, City, GitHub, LinkedIn, Skills, Status.
                </p>
              </div>
            </div>
            <button
              onClick={downloadSampleTemplate}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sample CSV</span>
            </button>
          </div>

          {/* Input Method Selector & Default Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl max-w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload File (.csv)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Paste CSV / Text
              </button>
            </div>

            {/* Default Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Assign Status:</span>
              <select
                value={defaultStatus}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setDefaultStatus(val);
                  // Update parsed rows status if not set in file
                  setParsedRows((prev) =>
                    prev.map((r) => ({ ...r, status: val }))
                  );
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0099e6] cursor-pointer"
              >
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending Review</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
            </div>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .tsv, .txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-[#0099e6] bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#0099e6] group-hover:scale-105 transition-all">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      CSV, TSV, or comma-delimited text file (max 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0099e6] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows detected
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setParsedRows([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Paste Data */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Paste CSV or Tabular Data (from Google Sheets / Excel):
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Name,Email,Phone,College,Skills&#10;Aarav Sharma,aarav@gmail.com,9876543210,IIT Bombay,Next.js; Python&#10;Priya Patel,priya@gmail.com,9876543211,BITS Pilani,React; Node.js"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#0099e6] focus:bg-white transition-all resize-none"
              />
              <p className="text-[10px] text-slate-400">
                Tip: You can copy cells directly from Google Sheets or Excel and paste here.
              </p>
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0099e6]" />
                    Parsed Preview
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                      {invalidCount} Invalid (skipped)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  Showing first {Math.min(5, parsedRows.length)} of {parsedRows.length}
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Applicant Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">College</th>
                        <th className="py-2.5 px-3">Skills</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.valid ? 'hover:bg-slate-50/60' : 'bg-red-50/40 text-red-800'}
                        >
                          <td className="py-2 px-3">
                            {row.valid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <span title={row.error} className="flex items-center text-red-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold">{row.name || '—'}</td>
                          <td className="py-2 px-3 font-mono">{row.email}</td>
                          <td className="py-2 px-3 text-slate-500">{row.phone || '—'}</td>
                          <td className="py-2 px-3 text-slate-500">{row.college || '—'}</td>
                          <td className="py-2 px-3">
                            {row.skills && row.skills.length > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                {row.skills.join(', ')}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={validCount === 0 || isProcessing}
            className="px-5 py-2 rounded-xl bg-linear-to-r from-[#0099e6] to-[#0077b6] hover:from-[#0088cc] hover:to-[#00669e] text-white text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span>Importing...</span>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Import {validCount > 0 ? `${validCount} Registrations` : 'Registrations'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
