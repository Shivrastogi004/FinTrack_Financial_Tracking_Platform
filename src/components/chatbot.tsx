
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, User, Sparkles, Mic, MicOff } from 'lucide-react';
import { answerHelpQuestion } from '@/ai/flows/answer-help-question';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));


export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!SpeechRecognition) {
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript);
            setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            toast({
                title: 'Voice Error',
                description: `Speech recognition error: ${event.error}`,
                variant: 'destructive',
            });
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

    }, [toast]);
    
    const handleVoiceToggle = () => {
        if (!SpeechRecognition) {
            toast({
                title: 'Browser Not Supported',
                description: 'Your browser does not support voice recognition.',
                variant: 'destructive',
            });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleSend = async (messageToSend?: string) => {
        const currentMessage = messageToSend || input;
        if (!currentMessage.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: currentMessage };
        setMessages(prev => [...prev, userMessage]);
        if (!messageToSend) {
            setInput('');
        }
        setIsLoading(true);

        try {
            const result = await answerHelpQuestion({ question: currentMessage });
            const assistantMessage: ChatMessage = { role: 'assistant', content: result.answer };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chatbot error:', error);
            toast({
                title: 'AI Assistant Error',
                description: 'Could not get an answer at this time. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        size="icon"
                        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
                    >
                        <Bot className="h-7 w-7" />
                        <span className="sr-only">Open Chatbot</span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                           <Sparkles className="text-primary" /> AI Assistant
                        </SheetTitle>
                        <SheetDescription>
                            Ask me anything about FinTrack or personal finance!
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-grow my-4 pr-4">
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                                    {message.role === 'assistant' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback><Bot size={20}/></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn("rounded-lg p-3 max-w-[80%] text-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        {message.content}
                                    </div>
                                     {message.role === 'user' && (
                                        <Avatar className="h-8 w-8">
                                             <AvatarFallback><User size={20}/></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                     <Avatar className="h-8 w-8">
                                        <AvatarFallback><Bot size={20}/></AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg p-3 bg-muted flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <SheetFooter>
                        <div className="flex w-full items-center gap-2">
                             <Button variant="ghost" size="icon" onClick={handleVoiceToggle} disabled={!SpeechRecognition}>
                                {isListening ? <MicOff /> : <Mic />}
                                <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                            </Button>
                            <Textarea
                                placeholder={isListening ? "Listening..." : "Type your message..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                disabled={isLoading || isListening}
                                className="flex-grow resize-none"
                            />
                            <Button onClick={() => handleSend()} disabled={isLoading || !input.trim() || isListening}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
