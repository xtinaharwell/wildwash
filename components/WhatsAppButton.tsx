"use client";
import { useEffect, useState } from "react";

export default function WhatsAppButton() {
  const whatsappNumber = "+254705415948";
  const whatsappText = "Hi%20Wild%20Wash!%20I%20need%20help%20with%20my%20order.";
  const href = `https://api.whatsapp.com/send?phone=${encodeURIComponent(whatsappNumber)}&text=${whatsappText}`;

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // hide button when footer is visible in viewport
          setHidden(entry.isIntersecting);
        });
      },
      { threshold: 0.01 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (hidden) return null;

  return (
    <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with Wild Wash on WhatsApp"
    className="fixed z-[9999] flex items-center gap-3 rounded-full bg-red-500 hover:brightness-95 shadow-lg px-3 py-2 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
    // use the safe-area CSS so the button doesn't sit under home indicators / notches
    style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        right: "calc(env(safe-area-inset-right, 0px) + 16px)",
    }}
    >
    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 0 5.373 0 12a11.94 11.94 0 003.48 8.52L0 24l3.6-1.02A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.2-1.12-6.16-3.48-8.52z" fill="#25D366"></path>
        <path d="M17.1 14.1c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.67.15-.2.3-.78.96-.95 1.16-.17.2-.34.22-.63.07-.3-.15-1.27-.47-2.42-1.48-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.12.3-.34.45-.51.15-.17.2-.28.3-.47.1-.2 0-.38-.05-.53-.05-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.36-.01-.55-.01-.2 0-.52.07-.79.37-.27.3-1.02 1-1.02 2.44 0 1.44 1.05 2.83 1.2 3.03.15.2 2.08 3.2 5.05 4.49 2.98 1.29 2.98.86 3.52.81.54-.05 1.74-.71 1.99-1.4.25-.69.25-1.28.17-1.4-.08-.12-.27-.2-.57-.35z" fill="#FFF"></path>
        </svg>
    </span>

    <span className="hidden sm:inline-block text-sm font-semibold text-white select-none">
        Chat on WhatsApp
    </span>
    </a>
  );
}
