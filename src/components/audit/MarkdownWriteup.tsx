"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownWriteupProps {
  content: string;
  className?: string;
}

export function MarkdownWriteup({ content, className }: MarkdownWriteupProps) {
  return (
    <div
      className={cn(
        "markdown-writeup text-[13px] leading-6 text-text-primary break-words",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 text-xl font-semibold tracking-tight text-text-primary first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 text-base font-semibold tracking-tight text-text-primary first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-4 text-sm font-semibold text-text-primary first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1.5 mt-3 text-sm font-medium text-text-primary first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-text-secondary last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1.5 pl-5 text-text-secondary last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-text-secondary last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-6 marker:text-text-tertiary">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-text-primary">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-text-secondary">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-accent/50 pl-3 text-text-secondary italic last:mb-0">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => {
            const isBlock = Boolean(codeClassName);
            if (isBlock) {
              return (
                <code className="font-mono text-[12px] text-text-primary">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[12px] text-accent">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-black/30 px-3 py-2 last:mb-0">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-4 border-white/10" />,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto last:mb-0">
              <table className="w-full min-w-[320px] border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/15 text-text-primary">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-white/10 last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 font-semibold text-text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 text-text-secondary">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
