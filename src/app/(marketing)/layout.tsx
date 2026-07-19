import { Backdrop } from "@/components/marketing/Backdrop";
import { Navbar } from "@/components/marketing/Navbar";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Backdrop />
      <Navbar />
      {children}
    </>
  );
}
