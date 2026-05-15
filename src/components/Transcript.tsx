import { useRef, useEffect, useState, memo, useCallback } from 'react';
import gsap from 'gsap';
import type { Message } from '@/types';

interface TranscriptProps {
  messages: Message[];
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const UserMessage = memo(function UserMessage({
  content,
  timestamp,
}: {
  content: string;
  timestamp: number;
}) {
  return (
    <div className="flex flex-col items-end w-full">
      <div
        className="max-w-[80%] px-4 py-3"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px 12px 12px 8px',
        }}
      >
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {content}
        </p>
      </div>
      <span
        className="mt-1 text-xs font-medium uppercase"
        style={{
          color: 'var(--text-tertiary)',
          letterSpacing: '0.05em',
        }}
      >
        {formatTime(timestamp)}
      </span>
    </div>
  );
});

const AIMessage = memo(function AIMessage({
  content,
  timestamp,
  isNew,
}: {
  content: string;
  timestamp: number;
  isNew: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isNew || !containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const words = wordsRef.current.filter(Boolean);
    if (words.length === 0) return;

    gsap.set(words, { opacity: 0 });

    const tl = gsap.timeline();
    tl.to(words, {
      opacity: 1,
      duration: 0.12,
      stagger: 0.035,
      ease: 'power2.out',
    });
    tl.fromTo(
      containerRef.current,
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' },
      0
    );

    return () => {
      tl.kill();
    };
  }, [isNew, content]);

  const words = content.split(' ');

  return (
    <div ref={containerRef} className="flex flex-col items-start w-full">
      <div className="max-w-full py-3">
        <p
          className="text-xl font-light leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {isNew
            ? words.map((word, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    if (el) wordsRef.current[i] = el;
                  }}
                  className="inline-block mr-[0.3em]"
                >
                  {word}
                </span>
              ))
            : content}
        </p>
      </div>
      <span
        className="mt-1 text-xs font-medium uppercase"
        style={{
          color: 'var(--text-tertiary)',
          letterSpacing: '0.05em',
        }}
      >
        {formatTime(timestamp)}
      </span>
    </div>
  );
});

export const Transcript = memo(function Transcript({
  messages,
}: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevCountRef = useRef(messages.length);
  const seenRef = useRef<Set<number>>(new Set());

  // Track new messages for animation
  useEffect(() => {
    messages.forEach((m) => {
      if (m.role === 'assistant') {
        seenRef.current.add(m.timestamp);
      }
    });
    prevCountRef.current = messages.length;
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !autoScroll) return;
    if (messages.length !== prevCountRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(dist < 80);
  }, []);

  // Determine which assistant messages are "new" (added after initial render)
  const mountTimeRef = useRef(Date.now());
  const isNewMessage = useCallback(
    (msg: Message) => {
      return msg.role === 'assistant' && msg.timestamp > mountTimeRef.current;
    },
    []
  );

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="w-full overflow-y-auto custom-scrollbar"
      style={{
        maxHeight: '35vh',
        maxWidth: 600,
        padding: '16px 20px',
      }}
    >
      <div className="flex flex-col gap-3">
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <UserMessage
              key={msg.timestamp}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ) : (
            <AIMessage
              key={msg.timestamp}
              content={msg.content}
              timestamp={msg.timestamp}
              isNew={isNewMessage(msg)}
            />
          )
        )}
      </div>
    </div>
  );
});
