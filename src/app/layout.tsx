import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
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
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}

