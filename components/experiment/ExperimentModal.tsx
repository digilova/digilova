"use client";

import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./ExperimentModal.module.css";

export function ExperimentModal({
  open,
  onClose,
  onExitComplete,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onExitComplete?: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const phaseRef = useRef<"open" | "closing">("open");
  const [phase, setPhase] = useState<"open" | "closing">("open");

  if (open && phase !== "open") {
    setPhase("open");
  } else if (!open && phase === "open") {
    setPhase("closing");
  }
  phaseRef.current = phase;

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (phaseRef.current !== "open") return;

      if (event.key === "Escape") {
        if (event.defaultPrevented) return;
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (phase !== "closing") return;
    onExitComplete?.();
  }

  return createPortal(
    <div
      className={styles.overlay}
      data-phase={phase}
      onAnimationEnd={handleAnimationEnd}
      onClick={phase === "open" ? onClose : undefined}
      role="presentation"
    >
      <div
        aria-label={title}
        aria-modal="true"
        className={styles.dialog}
        data-phase={phase}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <div className={styles.header}>
          <button
            aria-label="Close"
            className={styles.close}
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <svg
              aria-hidden="true"
              className={styles.closeIcon}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
              viewBox="0 0 18 18"
            >
              <path d="M5 5l8 8" />
              <path d="M13 5l-8 8" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
