import { useState } from 'react';
import { Bot, X, Send, Sparkles, Package, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';

const quickActions = [
  { icon: Package, label: 'Add stock', prompt: 'Add 50 iPhone 15 Pro Max to stock' },
  { icon: FileText, label: 'Create invoice', prompt: 'Create an invoice for 5 iPhone 13 for Mark' },
  { icon: BarChart3, label: "Today's sales", prompt: "Show me today's sales" },
];

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "👋 Hello! I'm your AI assistant for NFB Trading. I can help you manage stock, create invoices, and generate reports. Just tell me what you need!",
    timestamp: new Date(),
  },
];

export function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSimulatedResponse(input),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getSimulatedResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('invoice') && lowerQuery.includes('create')) {
      return "✅ I've created a new invoice! Invoice #INV-2024-004 has been generated. You can view and edit it in the Invoices section.";
    }
    if (lowerQuery.includes('stock') && (lowerQuery.includes('add') || lowerQuery.includes('50'))) {
      return "✅ Stock updated successfully! I've added the items to your inventory. Current stock levels have been refreshed.";
    }
    if (lowerQuery.includes('sales') || lowerQuery.includes('today')) {
      return "📊 Today's Sales Summary:\n• Total Revenue: €8,945\n• Orders: 12\n• Top Product: iPhone 15 Pro Max (5 units)\n• Average Order Value: €745";
    }
    if (lowerQuery.includes('low') && lowerQuery.includes('stock')) {
      return "⚠️ Low Stock Alert:\n• iPhone 15 (8 units) - Min: 15\n• iPhone 14 (5 units) - Min: 10\n• iPad Pro 12.9\" (3 units) - Min: 8\n\nWould you like me to create a restock order?";
    }
    
    return "I understand you want to " + query + ". This feature will be fully functional once connected to the backend. Would you like me to help with something else?";
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'floating-chat h-14 w-14 rounded-full btn-accent-gradient flex items-center justify-center shadow-elevated transition-all duration-300 hover:scale-110',
          isOpen && 'opacity-0 pointer-events-none'
        )}
      >
        <Bot className="h-6 w-6 text-accent-foreground" />
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 w-[400px] rounded-2xl bg-card border border-border shadow-elevated transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">AI Assistant</h3>
              <p className="text-xs text-primary-foreground/70">Powered by Gemini</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="h-[350px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'chat-bubble max-w-[85%] rounded-2xl p-3',
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              )}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>
          ))}
          {isTyping && (
            <div className="bg-muted rounded-2xl rounded-bl-md p-3 max-w-[85%]">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.prompt)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 input-focus"
            />
            <Button type="submit" size="icon" className="btn-accent-gradient shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
