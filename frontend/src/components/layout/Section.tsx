import * as React from "react";
import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" };

export function Section({ as: Tag = "section", className, children, ...rest }: Props) {
  return (
    <Tag className={cn(className)} {...rest}>
      {children}
    </Tag>
  );
}
