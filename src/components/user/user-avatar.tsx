import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
	src?: string;
	name?: string;
	className?: string;
}

const COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-fuchsia-500", "bg-teal-500"];

// Users without a photo get their initial on a colour derived from their name,
// so members are distinguishable instead of all sharing one placeholder.
function colorFor(name: string) {
	let hash = 0;
	for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
	return COLORS[Math.abs(hash) % COLORS.length];
}

export function UserAvatar({ src, name = "", className }: UserAvatarProps) {
	return (
		<Avatar className={cn("w-7 h-7 md:h-10 md:w-10", className)}>
			{src && <AvatarImage src={src} alt={name || "avatar"} className="object-cover" />}
			<AvatarFallback className={cn("text-white font-semibold", colorFor(name))}>
				{name.trim().charAt(0).toUpperCase() || "?"}
			</AvatarFallback>
		</Avatar>
	);
}
