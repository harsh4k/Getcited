import { Backdrop } from "@/components/marketing/Backdrop";

export default function AccountLayout({
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
