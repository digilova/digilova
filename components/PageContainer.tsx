import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({
  children,
  className,
}: PageContainerProps) {
  const classes = ["page-column", className].filter(Boolean).join(" ");

  return <main className={classes}>{children}</main>;
}
