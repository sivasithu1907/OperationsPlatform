
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Customer } from '../types';
import { validatePhone, formatPhoneDisplay, normalizePhone } from '../utils/phoneUtils';
import { Search, UserPlus, CheckCircle2, AlertTriangle, X, Phone, User, Save, AlertCircle } from 'lucide-react';
import { generateCustomerId } from '../utils/idUtils';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomerId?: string;
  onSelect: (customer: Customer) => void;
  onCreateNew: (customer: Customer) => void;
  onManualCreate?: (initialPhone: string) => void;
}

// Helper to escape regex special characters
const escapeRegExp = (string: string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const HighlightedPhone = ({ text, highlight }: { text: string, highlight: string }) => {
  // Safeguard against non-string inputs
  if (!highlight || typeof highlight !== 'string') return <>{text}</>;
  
  try {
      const digits = highlight.replace(/\D/g, '');
      if (!digits) return <>{text}</>;

      // Create pattern that allows optional spaces/dashes between chars of highlight
      const patternStr = digits.split('').map(escapeRegExp).join('[\\s-]*');
      const regex = new RegExp(`(${patternStr})`, 'gi');
      const parts = text.split(regex);
      return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? <span key={i} className="bg-yellow-200 font-bold text-slate-900">{part}</span> : part
            )}
        </span>
      );
  } catch (e) {
      return <>{text}</>;
  }
};

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ customers, selectedCustomerId, onSelect, onCreateNew, onManualCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // --- Normalization Helper ---
  // Using normalizePhone from utils handles type safety automatically
  const getNormalizedDigits = (val: unknown) => {
      // We want raw digits for matching, so we strip non-digits from the safe string
      const str = String(val ?? "");
      return str.replace(/\D/g, '');
  };

  // --- Sync Search Term on Selection ---
  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.name);
    }
  }, [selectedCustomer]);

  // --- Match Logic ---
  const inputDigits = getNormalizedDigits(searchTerm);
  const isSelectedName = selectedCustomer && searchTerm === selectedCustomer.name;

  const exactMatch = useMemo(() => {
      if (!searchTerm || isSelectedName || inputDigits.length < 7) return null;
      
      return customers.find(c => {
          const storedDigits = getNormalizedDigits(c.phone);
          return storedDigits === inputDigits;
      });
  }, [searchTerm, customers, isSelectedName, inputDigits]);

  const partialMatches = useMemo(() => {
      if (!searchTerm || isSelectedName) return [];
      if (inputDigits.length === 0) return [];

      return customers.filter(c => {
          const storedDigits = getNormalizedDigits(c.phone);
          return storedDigits.includes(inputDigits) && c.id !== exactMatch?.id;
      });
  }, [searchTerm, customers, isSelectedName, inputDigits, exactMatch]);


  // Determine UI State
  const showBanner = !!exactMatch && !selectedCustomer;
  const showDropdown = isOpen && !isSelectedName && (partialMatches.length > 0 || (!exactMatch && inputDigits.length > 0));

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedCustomer) {
            setSearchTerm(selectedCustomer.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomer]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    // 1. Critical: Prevent Browser Navigation
    e.preventDefault();
    e.stopPropagation();
    
    // Reset errors
    setPhoneError(null);
    setSaveError(null);

    try {
        // 2. Validation
        if (!newName || !newName.trim()) {
            setSaveError("Customer Name is required.");
            return;
        }

        const validation = validatePhone(newPhone);
        if (!validation.isValid) {
            setPhoneError(validation.error || 'Invalid phone number');
            return;
        }

        const formattedPhone = validation.formatted || newPhone;

        const exists = customers.find(c => c.phone === formattedPhone);
        if (exists) {
            setPhoneError(`Number already exists for ${exists.name}.`);
            return;
        }

        // 3. Create Safe Object (No undefined values)
        const newCustomer: Customer = {
            id: generateCustomerId(),
            name: newName.trim(),
            phone: formattedPhone,
            email: '',
            address: '',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName.trim())}&background=random`
        };

        // 4. Safe State Updates (Wrapped in try block)
        if (onCreateNew) {
            onCreateNew(newCustomer);
        }
        
        if (onSelect) {
            onSelect(newCustomer);
        }

        // 5. Update Local UI
        setSearchTerm(newCustomer.name);
        setNewName('');
        setNewPhone('');
        setShowCreateModal(false);
        setIsOpen(false);

    } catch (err) {
        console.error("CRITICAL: Error saving customer", err);
        setSaveError("Failed to save customer. Please try again.");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer <span className="text-red-500">*</span></label>
      
      {/* Input Field */}
      <div className="relative">
        <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search by phone..."
            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 pl-9 text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400"
        />
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        
        {selectedCustomer && searchTerm === selectedCustomer.name && (
            <CheckCircle2 size={16} className="absolute right-3 top-3 text-emerald-500" />
        )}
      </div>

      {/* EXACT MATCH BANNER */}
      {showBanner && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-emerald-50 border border-emerald-200 p-3 rounded-lg z-20 flex items-center justify-between shadow-lg animate-in slide-in-from-top-1 duration-200">
              <div>
                  <div className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Client Found
                  </div>
                  <div className="text-sm font-bold text-slate-800">{exactMatch.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{formatPhoneDisplay(exactMatch.phone)}</div>
              </div>
              <button 
                type="button"
                onClick={() => { 
                    onSelect(exactMatch); 
                    setSearchTerm(exactMatch.name); 
                    setIsOpen(false); 
                }}
                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                  Select
              </button>
          </div>
      )}

      {/* DROPDOWN LIST */}
      {showDropdown && (
          <div className={`absolute left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-100 ${showBanner ? 'top-[calc(100%+80px)]' : 'top-full mt-1'}`}>
              {partialMatches.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => { onSelect(c); setSearchTerm(c.name); setIsOpen(false); }}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex flex-col"
                  >
                      <span className="text-sm font-bold text-slate-900">{c.name}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">
                           <HighlightedPhone text={formatPhoneDisplay(c.phone)} highlight={searchTerm} />
                      </span>
                  </div>
              ))}
              
              {!exactMatch && (
                  <div className="p-2 sticky bottom-0 bg-white border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => { 
                            if (onManualCreate) {
                                onManualCreate(searchTerm);
                                setIsOpen(false);
                            } else {
                                setShowCreateModal(true); 
                                setNewPhone(searchTerm); 
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                          <UserPlus size={16} />
                          + Create New Customer
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Create Modal (Only used if onManualCreate is NOT provided) */}
      {showCreateModal && !onManualCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-900">Add New Customer</h3>
                      <button type="button" onClick={() => setShowCreateModal(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name <span className="text-red-500">*</span></label>
                          <div className="relative">
                              <User size={16} className="absolute left-3 top-3 text-slate-400"/>
                              <input 
                                required
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg p-2.5 pl-9 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="e.g. John Doe"
                              />
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number <span className="text-red-500">*</span></label>
                          <div className="relative">
                              <Phone size={16} className="absolute left-3 top-3 text-slate-400"/>
                              <input 
                                required
                                value={newPhone}
                                onChange={(e) => { setNewPhone(e.target.value); setPhoneError(null); }}
                                className={`w-full bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg p-2.5 pl-9 text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${phoneError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                placeholder="3300 0000"
                              />
                          </div>
                          {phoneError && <p className="text-xs text-red-600 mt-1 font-medium">{phoneError}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">Default country: Qatar (+974)</p>
                      </div>

                      {saveError && (
                          <div className="p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700 flex items-center gap-1.5">
                              <AlertCircle size={14} /> {saveError}
                          </div>
                      )}

                      <div className="pt-2">
                          <button 
                            type="submit" 
                            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-bold shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                          >
                              <Save size={18} /> Save
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomerSelector;
