import { Backdrop } from "@/components/marketing/Backdrop";

export default function AbLayout({
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
