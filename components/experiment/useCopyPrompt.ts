"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyPrompt() {
  const [promptCopied, setPromptCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyPrompt = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setPromptCopied(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setPromptCopied(false);
        timeoutRef.current = null;
      }, 1600);
    } catch {
      setPromptCopied(false);
    }
  }, []);

  return { promptCopied, copyPrompt };
}
