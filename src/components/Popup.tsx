"use client";

import { CSSProperties, memo, ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  trigger: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}

function Popup({ trigger, children, style }: Props) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // use useEffect to force this to run client side
    const popup = popupRef.current as any;
    const trigger = triggerRef.current as any;
    if (!popup || !trigger) return;

    if (open) {
      const { x, width, y } = trigger.getBoundingClientRect();

      let top = y - popup.scrollHeight - 25;
      let left = x - (popup.clientWidth - width) / 2;

      // Ensure popup doesn't go off screen
      top = Math.max(0, Math.min(top, window.innerHeight - popup.scrollHeight));
      left = Math.max(0, Math.min(left, window.innerWidth - popup.clientWidth));

      popup.style["max-height"] = "95vh";
      popup.style.padding = "0.5rem 0.5rem";
      popup.style.border = "1px solid var(--primary)";
      popup.style.top = top + "px";
      popup.style.left = left + "px";
      popup.style.opacity = 1;
    } else {
      popup.style["max-height"] = "0px";
      popup.style.padding = "0rem 0.5rem";
      popup.style.border = "0px solid var(--primary)";
      popup.style.opacity = 0;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: any) {
      const trigger = triggerRef.current;
      const popup = popupRef.current;
      if (popup && trigger && !popup.contains(e.target) && !trigger.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [triggerRef, popupRef, open]);

  return (
    <>
      <style jsx>{`
        .popup {
          transition: opacity 0.1s;
          overflow: auto;
          position: fixed;
          border: 0px solid var(--primary);
          max-height: 0px;
          min-width: min(25rem, 80vw);
          max-width: 80vw;
          padding: 0rem 0.5rem;
          border-radius: 1rem;
          background: var(--background);
          opacity: 0;
        }
        .cancel {
          margin-top: 0.5rem;
        }
      `}</style>
      <div style={{ ...(style || {}) }} ref={triggerRef} onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      <div ref={popupRef} className="popup">
        {children}
      </div>
    </>
  );
}

export default memo(Popup);
