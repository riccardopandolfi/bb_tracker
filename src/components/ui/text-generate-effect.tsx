"use client";
import { useEffect, useMemo } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

const chunkWords = (wordsArray: string[], chunkSize = 2) => {
  const chunks: string[][] = [];
  for (let i = 0; i < wordsArray.length; i += chunkSize) {
    chunks.push(wordsArray.slice(i, i + chunkSize));
  }
  return chunks;
};

export const TextGenerateEffect = ({
    words,
    className,
  filter = true,
  duration = 0.5,
  textColor,
}: {
    words: string;
    className?: string;
  filter?: boolean;
  duration?: number;
  textColor?: string;
}) => {
    const [scope, animate] = useAnimate();
  const wordsArray = useMemo(() => words.trim().split(/\s+/), [words]);
  const groupedWords = useMemo(() => chunkWords(wordsArray, 2), [wordsArray]);

    useEffect(() => {
        animate(
      "[data-word]",
            {
                opacity: 1,
        filter: filter ? "blur(0px)" : "none",
            },
            {
        duration: duration ?? 1,
                delay: stagger(0.2),
            }
        );
  }, [animate, duration, filter, groupedWords.length]);

        return (
    <div className="w-full flex justify-center items-center text-center">
      <motion.div
        ref={scope}
        className="inline-flex flex-wrap justify-center items-center gap-x-6 gap-y-2"
      >
        {groupedWords.map((group, idx) => (
                        <motion.span
            key={group.join("-") + idx}
            data-word
            className={cn(
              "opacity-0 whitespace-nowrap leading-tight",
              className
            )}
            style={{
              filter: filter ? "blur(10px)" : "none",
              color: textColor,
            }}
                        >
            {group.join(" ")}
                        </motion.span>
        ))}
            </motion.div>
        </div>
    );
};
