import { Sparkles } from "lucide-react";
import clsx from "clsx";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  const iconBox = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "lg" ? 22 : size === "sm" ? 14 : 18;

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={clsx(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm",
          iconBox
        )}
      >
        <Sparkles size={iconSize} strokeWidth={2.25} />
      </div>
      <span className={clsx("font-extrabold tracking-tight", textSize)}>
        Lexoria
      </span>
    </div>
  );
}
