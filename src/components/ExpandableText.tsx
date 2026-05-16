import { useState, useRef, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
  className?: string;
  maxLines?: number;
}

export function ExpandableText({ text, className = "", maxLines = 1 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [text]);

  return (
    <div className="relative group">
      <p
        ref={textRef}
        className={`min-w-0 ${isExpanded ? "" : `line-clamp-${maxLines}`} cursor-pointer break-words transition-all ${isTruncated ? "hover:text-[var(--highlight)]" : ""} ${className}`}
        onClick={() => isTruncated && setIsExpanded(!isExpanded)}
        onMouseEnter={() => isTruncated && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {text}
      </p>

      {/* Tooltip for desktop */}
      {isTruncated && showTooltip && !isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 w-max max-w-xs bg-[var(--panel)] border border-[var(--border)] p-2 text-[0.75rem] rounded shadow-lg z-50 hidden md:block">
          {text}
        </div>
      )}

      {/* Mobile indicator */}
      {isTruncated && !isExpanded && (
        <div className="absolute right-0 top-0 text-[0.6rem] text-[var(--muted)] md:hidden">...</div>
      )}
    </div>
  );
}
