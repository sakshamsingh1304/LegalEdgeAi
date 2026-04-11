
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const [key, setKey] = useState(0);
  const wordsArray = words.split(" ");

  // Re-trigger animation when words change
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [words]);

  return (
    <div className={cn("font-medium", className)}>
      <div className="mt-2">
        <div className="text-inherit text-base leading-relaxed tracking-normal" key={key}>
          {wordsArray.map((word, idx) => (
            <motion.span
              key={word + idx}
              initial={{ opacity: 0, filter: filter ? "blur(10px)" : "none" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{
                duration: duration,
                delay: idx * 0.02,
              }}
              className="text-inherit"
            >
              {word}{" "}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};