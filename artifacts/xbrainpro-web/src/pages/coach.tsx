import { useState, useRef, useEffect } from "react";
import { useListChatMessages, useSendChatMessage, getListChatMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Coach() {
  const { data: messages, isLoading } = useListChatMessages();
  const sendMessage = useSendChatMessage();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const content = input;
    setInput("");

    sendMessage.mutate(
      { data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex-shrink-0 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">XBrain Architect</h1>
          <p className="text-sm text-primary font-medium">Neural Interface Active</p>
        </div>
      </div>

      <div className="flex-1 glass-card border border-white/5 rounded-3xl overflow-hidden flex flex-col relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollRef}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages?.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Bot className="w-12 h-12 opacity-20 mb-4" />
                  <p>The neural link is open. Ask for guidance, motivation, or protocol clarification.</p>
                </div>
              )}
              {messages?.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-3xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-sm' 
                      : 'bg-white/10 text-white/90 rounded-bl-sm border border-white/5'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] p-4 rounded-3xl bg-white/10 rounded-bl-sm border border-white/5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the architect..."
              className="flex-1 h-14 bg-white/5 border-white/10 rounded-full pl-6 pr-14 text-white focus-visible:ring-primary focus-visible:border-primary placeholder:text-white/30"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || sendMessage.isPending}
              className="absolute right-2 w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 shadow-glow"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
