"use client";

import { useRef, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import mermaid from "mermaid";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

function MermaidChart({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>('');
  
  useEffect(() => {
    let mounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        const { svg } = await mermaid.render(id, chart);
        if (mounted) setSvg(svg);
      } catch (e: any) {
        if (mounted) setSvg(`<div class="text-red-500 border border-red-500/20 p-4 rounded bg-red-500/10 text-sm font-mono">Error rendering chart: ${e.message}</div>`);
      }
    };
    renderChart();
    return () => { mounted = false; };
  }, [chart]);
  
  if (!svg) return <div className="animate-pulse bg-surface/50 h-32 w-full rounded-xl my-4 border border-border-soft"></div>;
  
  return (
    <div 
      className="mermaid-wrapper overflow-x-auto flex justify-center py-6 my-4 bg-surface/30 border border-border-soft rounded-2xl shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}

/** A code block with a hover "Copy" button (like Claude/ChatGPT). */
function CodeBlock({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = ref.current?.innerText ?? "";
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="group relative">
      <button
        onClick={copy}
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border-soft bg-overlay/80 px-2 py-1 font-mono text-[11px] text-muted opacity-0 backdrop-blur transition hover:text-foreground group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Copied
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.8" /></svg>
            Copy
          </>
        )}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

/**
 * Allow inline `data:image/…` URIs (the generate_image output) through, while
 * deferring to react-markdown's default sanitizer for every other URL. The
 * default transform strips `data:` URLs to "", which blanks the image src.
 */
function imageSafeUrlTransform(url: string) {
  if (url.startsWith("data:image/")) return url;
  return defaultUrlTransform(url);
}

/**
 * Renders an assistant message as markdown: code blocks (syntax-highlighted,
 * with a copy button), inline code, bold/italic, lists, tables, links, and
 * inline images — including the `![](data:image/…)` image-model outputs.
 */
export function MessageContent({ content }: { content: string }) {
  return (
    <div className="ember-markdown">
      <ReactMarkdown
        urlTransform={imageSafeUrlTransform}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match && match[1] === "mermaid") {
              return <MermaidChart chart={String(children).replace(/\n$/, "")} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }: any) => {
            const isMermaid = children?.props?.className?.includes("language-mermaid");
            if (isMermaid) {
              return <>{children}</>;
            }
            return <CodeBlock>{children}</CodeBlock>;
          },
          img: ({ alt, src }) =>
            typeof src === "string" && src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || "Generated image"}
                className="max-h-[440px] w-auto max-w-full rounded-xl border border-border-soft"
              />
            ) : null,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-ember-gold underline underline-offset-2 hover:text-ember-amber"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
