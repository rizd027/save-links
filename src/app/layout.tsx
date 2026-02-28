import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";
import { LayoutWrapper } from "../components/LayoutWrapper";
import { ModalManager } from "../components/modals/ModalManager";
import { NotificationProvider } from "../context/NotificationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SaveLinks - Link Management",
    description: "Organize, save, and manage all your important links in one place",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <AuthProvider>
                    <NotificationProvider>
                        <AppProvider>
                            <LayoutWrapper>
                                {children}
                            </LayoutWrapper>
                            <ModalManager />
                        </AppProvider>
                    </NotificationProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
