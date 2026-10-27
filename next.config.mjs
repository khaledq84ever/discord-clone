/** @type {import('next').NextConfig} */
const nextConfig = {
	// Keep native modules out of the webpack bundle so their .node bindings
	// resolve correctly at runtime (fixes Prisma 7 + better-sqlite3 "Could not
	// locate the bindings file" 500 on server-side queries).
	serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "bindings"],
	images: {
		// Uploads land in public/uploads at runtime, which the optimizer can't see (400),
		// and they are already resized client-side before upload.
		unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: "img.clerk.com",
				port: "",
			},
			{
				protocol: "https",
				hostname: "utfs.io",
				// pathname: `/a/${process.env.UPLOADTHING_APP_ID}/*`,
			},
			{
				protocol: "https",
				hostname: "i.imgur.com",
				port: "",
				pathname: "**",
			},
		],
	},
};

export default nextConfig;
