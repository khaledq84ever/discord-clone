"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MobileSheetProps {
	side: "left" | "right";
	label: string;
	icon: React.ReactNode;
	triggerClassName?: string;
	className?: string;
	children: React.ReactNode;
}

// Drawer for small screens; closes itself once the user navigates (e.g. picks a channel).
export function MobileSheet({ side, label, icon, triggerClassName, className, children }: MobileSheetProps) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" aria-label={label} className={triggerClassName}>
					{icon}
				</Button>
			</SheetTrigger>
			<SheetContent side={side} className={cn("p-0 flex gap-0", className)}>
				<SheetTitle className="sr-only">{label}</SheetTitle>
				{children}
			</SheetContent>
		</Sheet>
	);
}
