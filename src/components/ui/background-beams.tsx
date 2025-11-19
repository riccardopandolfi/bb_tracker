"use client";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute h-full w-full inset-0 bg-white",
                className
            )}
        >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-10 blur-[100px]"></div>
            <div className="absolute right-0 top-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-500 opacity-10 blur-[100px]"></div>
        </div>
    );
};
