import { Source } from '../types';
import { fetchWithRetry } from '../lib/fetchWithRetry';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat`;

/**
 * Streams the Gemini API response with RAG context for a realtime feel.
 * Note: The backend currently returns the full response at once, so we simulate streaming
 * or just return it chunk by chunk if we implement streaming later.
 * For now, we fetch the full response and simulate typing for consistency, 
 * although the UI likely handles typing effect if we pass full text too? 
 * Actually ChatPage.tsx uses TextGenerateEffect for completed messages, 
 * but for streaming it updates state.
 */
export const streamRagApi = async (query: string, onChunk: (text: string) => void) => {
  try {
    const response = await fetchWithRetry(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
      {
        maxRetries: 3,
        initialDelayMs: 3000,
        onRetry: (attempt, max) => {
          onChunk(`⏳ Backend is waking up... retrying (${attempt}/${max})`);
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content;

    // Simulate streaming by pretending to receive chunks, 
    // or just send the whole thing. 
    // Sending the whole thing is safer and faster for now.
    onChunk(content);

    return {
      content: content,
      sources: data.sources || []
    };
  } catch (error) {
    console.error("Backend API Error:", error);
    onChunk("⚠️ Could not connect to the backend. It may be starting up — please try again in a few seconds.");
    return { content: "", sources: [] };
  }
};

/**
 * Original non-streaming call for backward compatibility or simple tasks.
 */
export const callRagApi = async (query: string, files?: File[]) => {
  return streamRagApi(query, () => { });
};

const mockSources = (query: string): Source[] => {
  return [
    {
      title: "MCA Handbook on Company Incorporation",
      authority: "MCA",
      preview: "...the process of SPICe+ filing involves Part A for name reservation and Part B for incorporation...",
      confidence: 0.94,
      url: "https://mca.gov.in"
    },
    {
      title: "GST Act 2017 - Chapter 6",
      authority: "GST",
      preview: "...every person who makes a taxable supply of goods or services or both if his aggregate turnover...",
      confidence: 0.88,
      url: "https://gst.gov.in"
    }
  ];
};