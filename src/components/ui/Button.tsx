import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ButtonProps {
  variant?: "primary" | "ghost" | "danger" | "outline";
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function Button({ variant = "primary", children, className = "", ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-violet text-ivory border border-violet/60 hover:bg-violet-deep active:scale-[0.98] shadow-[0_0_24px_rgba(139,92,246,0.25)]",
    ghost: "bg-transparent text-mist hover:text-ivory border border-transparent",
    outline: "bg-transparent text-ivory border border-violet/40 hover:border-violet hover:bg-violet/10",
    danger: "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`font-display inline-flex items-center justify-center gap-2 px-5 py-3 text-sm uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
