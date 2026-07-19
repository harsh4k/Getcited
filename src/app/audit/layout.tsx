import { Suspense } from "react";
import { Backdrop } from "@/components/marketing/Backdrop";

export default function AuditLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Backdrop />
      <Suspense
        fallback={
          <div className="flex h-dvh items-center justify-center text-sm text-text-secondary">
            Loading audit…
          </div>
        }
      >
        {children}
      </Suspense>
    </>
  );
}
