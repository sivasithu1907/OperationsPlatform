import React from 'react';
import { Cloud, Lock, Server, Terminal } from 'lucide-react';

const IntegrationGuide = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-4">Deployment & Integration Guide</h1>
            <p className="text-slate-500">How to connect WhatsApp API and deploy to the cloud.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Cloud size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">Cloud Deployment</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Recommended architecture uses AWS Lambda or Google Cloud Functions for serverless scaling.
                </p>
                <div className="bg-slate-900 text-slate-300 p-3 rounded-md text-xs font-mono">
                    npm run build<br/>
                    gcloud app deploy
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                    <Server size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">WhatsApp Webhooks</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Configure your Meta App Dashboard to point to your deployed URL.
                </p>
                <div className="bg-slate-100 text-slate-600 p-3 rounded-md text-xs font-mono break-all">
                    POST https://api.yourdomain.com/webhook/whatsapp
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-2">Security Checklist</h2>
            
            <div className="flex gap-4">
                <div className="mt-1"><Lock className="text-emerald-600" size={20} /></div>
                <div>
                    <h4 className="font-bold">API Key Rotation</h4>
                    <p className="text-sm text-slate-600">Ensure `GEMINI_API_KEY` is stored in Secret Manager, not in code.</p>
                </div>
            </div>
            
            <div className="flex gap-4">
                <div className="mt-1"><Terminal className="text-emerald-600" size={20} /></div>
                <div>
                    <h4 className="font-bold">Webhook Signature Verification</h4>
                    <p className="text-sm text-slate-600">Verify `X-Hub-Signature-256` header on all incoming POST requests from Meta.</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default IntegrationGuide;