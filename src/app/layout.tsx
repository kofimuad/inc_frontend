import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import SessionTimeoutGuard from "@/components/common/SessionTimeoutGuard";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Clinette Shipping & Logistics | Your Trusted Freight Partner",
  description: "Clinette Shipping & Logistics offers reliable air freight, ocean freight, customs clearance, and procurement services. Track your shipments and get quotes today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ubuntu.variable} ${ubuntu.className} antialiased`} suppressHydrationWarning={true}>
        <AuthProvider>
            {/* Mounted here rather than inside AuthProvider so the provider does
                not import a component that consumes its own context. */}
            <SessionTimeoutGuard />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}

