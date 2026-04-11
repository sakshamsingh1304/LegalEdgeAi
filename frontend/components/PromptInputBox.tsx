
import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Mic } from 'lucide-react';

interface PromptInputBoxProps {
  onSend: (message: string, files?: File[]) => void;
}

const PromptInputBox: React.FC<PromptInputBoxProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSend(message, files);
      setMessage('');
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-sm group">
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="relative group">
        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
        <div className="relative glass border border-white/10 rounded-2xl flex items-end p-2 gap-2 shadow-2xl focus-within:border-emerald-500/50 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Paperclip size={20} />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={handleFileChange}
          />

          <textarea
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about GST registration, MCA filing, FDI norms..."
            className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-500 py-3 px-1 resize-none min-h-[48px] max-h-40 outline-none"
          />

          <div className="flex items-center gap-1">
            <button className="p-3 text-gray-400 hover:text-emerald-400 rounded-xl transition-colors">
              <Mic size={20} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!message.trim() && files.length === 0}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] text-gray-500">
        AI responses are based on verified government documentation but should not replace professional legal advice.
      </p>
    </div>
  );
};

export default PromptInputBox;