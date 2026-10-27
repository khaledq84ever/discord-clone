"use client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Smile } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface EmojiPickerProps {
	onChange: (value: string) => void;
}

function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const query = window.matchMedia("(max-width: 767px)");
		const update = () => setIsMobile(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);
	return isMobile;
}

export function EmojiPicker({ onChange }: EmojiPickerProps) {
	const { resolvedTheme } = useTheme();
	const isMobile = useIsMobile();
	return (
		<Popover>
			<PopoverTrigger aria-label="Pick emoji">
				<Smile
					className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
					size={20}
				/>
			</PopoverTrigger>
			<PopoverContent
				// On phones the picker opens above the input and is narrowed to fit the screen.
				side={isMobile ? "top" : "right"}
				align={isMobile ? "end" : "center"}
				sideOffset={isMobile ? 12 : 40}
				collisionPadding={8}
				className={
					isMobile
						? "w-auto p-0 bg-transparent border-none shadow-none drop-shadow-none"
						: "bg-transparent border-none shadow-none drop-shadow-none mb-16"
				}
			>
				<Picker
					theme={resolvedTheme}
					data={data}
					perLine={isMobile ? 7 : 9}
					previewPosition={isMobile ? "none" : "bottom"}
					onEmojiSelect={(emoji: any) => onChange(emoji.native)}
				/>
			</PopoverContent>
		</Popover>
	);
}
