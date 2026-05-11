import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Send, ImagePlus, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { onChatSnapshot, sendChatMessage } from '../services/storage';
import type { ChatMessage } from '../types';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsubscribe = onChatSnapshot((msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!text.trim() && !imagePreview) || !user || sending) return;
    setSending(true);
    await sendChatMessage({
      userId: user.id,
      userName: user.name,
      text: text.trim(),
      imageData: imagePreview || undefined,
    });
    setText('');
    setImagePreview(null);
    setSending(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Afbeelding mag maximaal 5MB zijn');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isOwnMessage = (msg: ChatMessage) => msg.userId === user?.id;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <h2 className="text-lg font-bold text-gray-800">Groepschat</h2>
        <p className="text-xs text-gray-400">Deel foto's en berichten over Mayla</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Nog geen berichten</p>
            <p className="text-sm mt-1">Stuur een bericht of foto van Mayla!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                isOwnMessage(msg)
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
              }`}
            >
              {!isOwnMessage(msg) && (
                <p className="text-xs font-semibold text-primary-600 mb-1">{msg.userName}</p>
              )}
              {msg.imageData && (
                <img
                  src={msg.imageData}
                  alt="Gedeelde foto"
                  className="rounded-xl mb-2 max-h-64 w-full object-cover cursor-pointer"
                  onClick={() => window.open(msg.imageData, '_blank')}
                />
              )}
              {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
              <p
                className={`text-[10px] mt-1 ${
                  isOwnMessage(msg) ? 'text-primary-200' : 'text-gray-400'
                }`}
              >
                {formatDistanceToNow(parseISO(msg.timestamp), { addSuffix: true, locale: nl })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Foto uit galerij"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="p-2.5 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Foto maken"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Typ een bericht..."
            rows={1}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={(!text.trim() && !imagePreview) || sending}
            className="p-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
