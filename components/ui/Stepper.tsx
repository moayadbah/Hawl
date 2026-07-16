import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/cn";

const STEPS = ["الربط", "الأصول", "سجل الحول", "الزكاة"];

export function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {STEPS.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  active && "bg-alinma-navy text-white",
                  done && "bg-alinma-lavender text-white",
                  !active && !done && "bg-alinma-cream text-alinma-navy/50",
                )}
              >
                {done ? <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  active ? "font-medium text-alinma-navy" : "text-alinma-navy/45",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-4 sm:w-8",
                  done ? "bg-alinma-lavender" : "bg-alinma-navy/15",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
