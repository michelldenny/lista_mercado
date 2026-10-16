import { useState, useRef, useEffect } from "react";
import { ShoppingList } from "@/hooks/useShoppingLists";

type ChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  allLists: ShoppingList[];
  currentListId: string | null;
};

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function ChatModal({ isOpen, onClose, allLists, currentListId }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Olá! Sou seu assistente de compras. Como posso ajudar com sua lista hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          context: {
            listas: allLists.map(l => ({
              id: l.id,
              nomeDaLista: l.name,
              listaAtual: l.id === currentListId,
              itens: l.items.map(i => ({ nome: i.name, preco: i.price, quantidade: i.quantity, formato: i.format }))
            }))
          }
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages((prev) => [...prev, { role: "ai", text: `Erro: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", text: "Ocorreu um erro ao conectar com o assistente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] modal-overlay flex items-center justify-center p-4 animate-slide-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl flex flex-col h-[70vh]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-black text-slate-800">Assistente IA</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === "user" ? "bg-emerald-500 text-white rounded-br-none" : "bg-slate-100 text-slate-700 rounded-bl-none"}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 p-4 rounded-2xl rounded-bl-none text-sm animate-pulse">
                Pensando...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 pt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre sua lista..."
            className="flex-1 bg-slate-50 rounded-[1.5rem] px-5 py-4 outline-none focus:border-emerald-500 transition-all text-sm font-medium border border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-500 text-white px-6 py-4 rounded-[1.5rem] font-black shadow-xl shadow-emerald-100 uppercase text-xs tracking-widest disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
