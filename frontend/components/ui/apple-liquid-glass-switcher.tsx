
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Cloud } from "lucide-react";
import { cn } from "../../lib/utils";

type Theme = "light" | "dark" | "dim";

interface ThemeSwitcherProps {
  value?: Theme;
  onValueChange?: (theme: Theme) => void;
  defaultValue?: Theme;
}

const themeOptions = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dim" as const, icon: Cloud, label: "Dim" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
];

export function ThemeSwitcher({ value = "dark", onValueChange }: ThemeSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5 p-1 bg-white/5 border border-white/10 rounded-full relative backdrop-blur-sm shadow-inner isolate">
      {themeOptions.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onValueChange?.(option.value)}
            className={cn(
              "relative z-10 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
              isActive ? "text-emerald-400" : "text-gray-500 hover:text-gray-300"
            )}
            title={option.label}
            aria-label={`Switch to ${option.label} theme`}
            aria-pressed={isActive}
          >
            <option.icon size={14} strokeWidth={2.5} />
            {isActive && (
              <motion.div
                layoutId="theme-active-indicator"
                className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-full -z-10 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}