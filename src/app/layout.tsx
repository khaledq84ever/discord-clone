import "@/app/globals.css";
import { ModalProvider } from "@/contexts/modal-provider";
import { QueryProvider } from "@/contexts/query-provider";
import { SocketProvider } from "@/contexts/socket-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";

const open_sans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Discord Clone",
	description: "A Full-Featured Real Time (Video , Audio , Chat) Application",
	openGraph: {
		type: "website",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	// Let content extend under the notch / home indicator; padding uses env(safe-area-inset-*).
	viewportFit: "cover",
	// Shrink the layout viewport when the on-screen keyboard opens so the chat input stays visible.
	interactiveWidget: "resizes-content",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#313338" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="scroll-smooth" suppressHydrationWarning>
			<body className={cn(open_sans.className, "bg-white dark:bg-[#313338]")}>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					storageKey="discord-clone-theme"
					disableTransitionOnChange
				>
					<SocketProvider>
						<QueryProvider>
							<ModalProvider />
							{children}
						</QueryProvider>
					</SocketProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
