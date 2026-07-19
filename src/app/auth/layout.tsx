import { Backdrop } from "@/components/marketing/Backdrop";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Backdrop />
      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4">
        {children}
      </div>
    </>
  );
}
