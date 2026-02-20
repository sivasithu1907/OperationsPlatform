
import { AnalysisResult, Priority } from "../types";

const FALLBACK_RESULT: AnalysisResult = {
    summary: "AI Service Unavailable - Manual Review Required",
    service_category: "Unknown",
    priority: Priority.MEDIUM,
    remote_possible: false,
    recommended_action: "request_more_info",
    suggested_questions: ["Could you please provide more details?", "Is the device plugged in?"],
    draft_reply: "Thank you for contacting support. Our team will review your request shortly.",
    confidence: 0
};

export const analyzeTicketMessage = async (message: string, history: string[] = []): Promise<AnalysisResult> => {
  // List of endpoints to try in order. 
  // 1. Vite Proxy (standard)
  // 2. Direct Localhost (if proxy fails)
  // 3. IP fallback (common in some local setups)
  const endpoints = [
      '/api/analyze',
      'http://localhost:8080/api/analyze',
      'http://127.0.0.1:8080/api/analyze'
  ];

  for (const endpoint of endpoints) {
      try {
          console.log(`[Gemini Service] Attempting connection to: ${endpoint}`);
          
          const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message, history }),
          });

          if (!response.ok) {
              const text = await response.text();
              console.warn(`[Gemini Service] Error from ${endpoint}: ${response.status} ${text}`);
              continue; // Try next endpoint
          }

          const data = await response.json();
          
          // Normalize Priority
          let priorityVal = Priority.MEDIUM;
          if (data.priority === 'LOW') priorityVal = Priority.LOW;
          if (data.priority === 'HIGH') priorityVal = Priority.HIGH;
          if (data.priority === 'URGENT') priorityVal = Priority.URGENT;

          return { ...data, priority: priorityVal };

      } catch (e) {
          console.warn(`[Gemini Service] Connection failed to ${endpoint}`, e);
          // Continue to next endpoint
      }
  }

  // If loop finishes without success
  console.error("[Gemini Service] All connection attempts failed.");
  throw new Error("Backend Unreachable. Please ensure 'node server.js' is running in the 'backend' folder on port 8080.");
};

export const getChatResponse = async (history: { role: 'user' | 'model'; text: string }[], newMessage: string): Promise<string> => {
    const endpoints = [
        '/api/chat',
        'http://localhost:8080/api/chat',
        'http://127.0.0.1:8080/api/chat'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, newMessage }),
            });

            if (response.ok) {
                const data = await response.json();
                return data.text;
            }
        } catch (e) {
            console.warn(`[Chat Service] Failed ${endpoint}`);
        }
    }
    return "Error: Could not connect to AI Server. Please check backend.";
};
