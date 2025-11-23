"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

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
    let wordsArray = words.split(" ");
    useEffect(() => {
        animate(
            "span",
            {
                opacity: 1,
        filter: filter ? "blur(0px)" : "none",
            },
            {
        duration: duration ? duration : 1,
                delay: stagger(0.2),
            }
        );
    }, [scope.current]);

    const renderWords = () => {
        return (
            <motion.div ref={scope} className="inline-flex flex-wrap justify-center items-center gap-x-2 md:gap-x-3">
                {wordsArray.map((word, idx) => {
                    return (
                        <motion.span
                            key={word + idx}
              className={cn("opacity-0 whitespace-nowrap", className)}
              style={{
                filter: filter ? "blur(10px)" : "none",
                color: textColor,
              }}
                        >
                            {word}
                        </motion.span>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className="w-full flex justify-center items-center">
            {renderWords()}
        </div>
    );
};
