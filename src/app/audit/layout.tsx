import { Backdrop } from "@/components/marketing/Backdrop";

export default function AuditLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Backdrop />
      {children}
    </>
  );
}
