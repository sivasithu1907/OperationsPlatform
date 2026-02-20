
import React, { useState, useEffect, useRef } from 'react';
import { SimLog, Ticket, TicketStatus, Priority, MessageSender, TicketType } from '../types';
import { MessageSquare, Play, Database, Server, Smartphone, Loader2, MapPin, Home } from 'lucide-react';
import { analyzeTicketMessage } from '../services/geminiService';
import { generateTicketId, generateCustomerId } from '../utils/idUtils';

interface FlowSimulatorProps {
  onNewTicket: (ticket: Ticket) => void;
}

const FlowSimulator: React.FC<FlowSimulatorProps> = ({ onNewTicket }) => {
  const [phoneNumber, setPhoneNumber] = useState('+974 5555 0000');
  const [messageBody, setMessageBody] = useState('');
  const [locationUrl, setLocationUrl] = useState('https://maps.google.com/?q=25.2854,51.5310');
  const [houseNumber, setHouseNumber] = useState('Villa 12');
  const [logs, setLogs] = useState<SimLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (step: string, detail: string, status: 'success' | 'processing' | 'error' = 'success') => {
    const newLog: SimLog = {
      id: Math.random().toString(36).substr(2, 9),
      step,
      detail,
      timestamp: new Date().toLocaleTimeString(),
      status
    };
    setLogs(prev => [...prev, newLog]);
  };

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const runSimulation = async () => {
    if (!messageBody.trim()) return;
    setIsProcessing(true);
    setLogs([]);

    // Step 1: Webhook
    addLog('WEBHOOK_RX', `Received POST from WhatsApp Gateway. Sender: ${phoneNumber}`, 'success');
    await new Promise(r => setTimeout(r, 800));

    // Step 2: DB Lookup
    addLog('DB_QUERY', `Searching customer profile for ${phoneNumber}...`, 'processing');
    await new Promise(r => setTimeout(r, 1000));
    // Simulate finding or creating a customer ID
    const simCustId = generateCustomerId(); // Use generator for simulation consistency or mock
    addLog('DB_RESULT', `Customer found: "Simulated User". ID: ${simCustId}`, 'success');
    
    // Simulate Automatic Location Extraction
    if (locationUrl) {
         addLog('META_DATA', `Extracted Location URL: ${locationUrl}`, 'success');
    }

    // Step 3: AI Analysis
    addLog('AI_TRIAGE', 'Sending message content to Gemini Flash...', 'processing');
    
    try {
        const analysis = await analyzeTicketMessage(messageBody);
        addLog('AI_RESULT', `Intent: ${analysis.summary} | Priority: ${analysis.priority} | Cat: ${analysis.service_category}`, 'success');
        
        // Step 4: Ticket Creation
        await new Promise(r => setTimeout(r, 800));
        addLog('DB_WRITE', 'Creating new ticket record...', 'processing');

        const newTicket: Ticket = {
            id: generateTicketId(),
            customerId: simCustId, // Mocked ID from DB lookup step
            customerName: 'Simulated User',
            phoneNumber: phoneNumber,
            category: analysis.service_category,
            type: TicketType.WARRANTY, // Defaulting to WARRANTY for simulation
            priority: analysis.priority,
            status: TicketStatus.NEW,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            unreadCount: 1,
            locationUrl: locationUrl,
            houseNumber: houseNumber,
            messages: [{
                id: `m-${Math.random()}`,
                sender: MessageSender.CLIENT,
                content: messageBody,
                timestamp: new Date().toISOString()
            }]
        };

        onNewTicket(newTicket);
        addLog('SUCCESS', `Ticket ${newTicket.id} created and routed to Lead Dashboard.`, 'success');
        
        // Step 5: Auto-Reply
        await new Promise(r => setTimeout(r, 500));
        addLog('OUTBOUND_MSG', `Sent: "${analysis.draft_reply}"`, 'success');

    } catch (e) {
        addLog('ERROR', 'Pipeline failed during AI analysis', 'error');
    }

    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">WhatsApp Webhook Simulator</h2>
                        <p className="text-sm text-slate-500">Trigger an inbound message event</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input 
                            type="text" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-sm"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <MapPin size={12}/> Auto-Location (URL)
                            </label>
                            <input 
                                type="text" 
                                value={locationUrl}
                                onChange={(e) => setLocationUrl(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs text-slate-600"
                                placeholder="https://maps..."
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Home size={12}/> House No.
                            </label>
                            <input 
                                type="text" 
                                value={houseNumber}
                                onChange={(e) => setHouseNumber(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs text-slate-600"
                                placeholder="Villa 10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer Message</label>
                        <textarea 
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            rows={4}
                            placeholder="e.g., My internet is down and the red light is blinking."
                            className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>
                    <button 
                        onClick={runSimulation}
                        disabled={isProcessing || !messageBody}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <Play size={20} />}
                        Simulate Inbound Webhook
                    </button>
                </div>
            </div>

            {/* Console Log */}
            <div className="bg-slate-950 text-emerald-500 p-6 rounded-2xl shadow-lg font-mono text-xs flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-400">SERVER LOGS</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar" ref={scrollRef}>
                    {logs.length === 0 && (
                        <div className="text-slate-600 italic text-center mt-20">Waiting for trigger event...</div>
                    )}
                    {logs.map(log => (
                        <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                            <div>
                                <span className={`font-bold mr-2 ${
                                    log.step === 'AI_TRIAGE' ? 'text-purple-400' : 
                                    log.step === 'DB_WRITE' ? 'text-blue-400' : 'text-emerald-400'
                                }`}>{log.step}:</span>
                                <span className="text-slate-300">{log.detail}</span>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                         <div className="flex gap-2 items-center text-slate-500">
                             <span className="animate-pulse">_</span>
                         </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default FlowSimulator;
