import type { Metadata } from "next";



export const metadata: Metadata = {
	title: "Discord Clone - Login",
	description: "Log in to Discord & Discuss with your friends .",
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <div className="flex min-h-full justify-center items-center px-6 py-10">{children}</div>;
}
