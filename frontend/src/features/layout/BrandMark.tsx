import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  variant?: "header" | "footer";
};

/** Original `/public/logo.png` — no substitute assets */
export function BrandMark({ variant = "header" }: Props) {
  const isHeader = variant === "header";
  const imgClass = isHeader
    ? "h-10 w-auto max-h-[52px] shrink-0 object-contain object-left sm:h-11 sm:max-h-14"
    : "h-9 w-auto max-h-10 shrink-0 object-contain object-left sm:h-10";

  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 items-center gap-2.5 sm:gap-3",
        isHeader ? "shrink-0" : "max-w-full items-start"
      )}
    >
      <Image
        src="/logo.png"
        alt="RiseUp Academy"
        width={160}
        height={64}
        className={imgClass}
        priority={isHeader}
      />
      <div className="min-w-0 leading-tight">
        <div
          className={cn(
            "font-display font-extrabold tracking-tight text-violet-800",
            isHeader ? "text-lg sm:text-xl" : "text-base sm:text-lg"
          )}
        >
          <span>Rise</span>
          <span className="text-orange-500">Up</span> <span>Academy</span>
        </div>
        <div
          className={cn(
            "font-medium text-muted-foreground",
            isHeader ? "text-[11px] sm:text-xs" : "mt-1 text-xs"
          )}
        >
          The Peak of Learning.
        </div>
      </div>
    </Link>
  );
}
