import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { dark } from "@clerk/themes";
import { GithubIcon } from "lucide-react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mindlink Career Coach",
  description: "Advance your career with personalized guidance, interview prep, and AI-powered tools for job success.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            <footer className="bg-muted/50 pt-6 pb-6">
              <div className="flex flex-row justify-between w-full px-4 text-center text-gray-200">
                <p>Made by <Link href={"https://www.instagram.com/raval_krutarth"} target="_blank" className="text-primary underline">Krutarth Raval</Link></p>
                <Link href={"https://www.github.com/Krutarth-Raval"} target="_blank" className="flex items-center justify-center bg-muted p-2 rounded-full border-2 border-gray-700 shadow-lg">
                  <GithubIcon className="h-6 w-6 text-primary" />
                  <p className="text-gray-200 px-2">Github</p>
                </Link>
              </div>
            </footer>
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
