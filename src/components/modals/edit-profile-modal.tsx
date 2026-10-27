"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user/user-avatar";
import { UploadDropzone } from "@/lib/uploadthing";
import { useStore } from "@/store/store";
import axios from "axios";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function EditProfileModal() {
	const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onClose = useStore.use.onClose();
	const { profile } = useStore.use.data();
	const isModalOpen = isOpen && type === "editProfile";

	const [name, setName] = useState("");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isModalOpen && profile) {
			setName(profile.name);
			setImageUrl(profile.imageUrl ?? null);
			setError("");
		}
	}, [isModalOpen, profile]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return setError("Display name is required");
		try {
			setIsLoading(true);
			await axios.patch("/api/profile", { name, imageUrl });
			onClose();
			router.refresh();
		} catch (err: any) {
			setError(err?.response?.data?.error || "Could not save profile");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={onClose}>
			<DialogContent className="bg-white text-black p-0 overflow-y-auto">
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">Your profile</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						This is how other members see you in every server.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-6">
					<div className="space-y-6 px-6">
						<div className="flex flex-col items-center gap-3">
							{imageUrl ? (
								<div className="relative">
									<UserAvatar src={imageUrl} name={name} className="h-24 w-24 md:h-24 md:w-24" />
									<button
										type="button"
										onClick={() => setImageUrl(null)}
										aria-label="Remove photo"
										className="absolute top-0 right-0 rounded-full bg-rose-500 p-1 text-white shadow-sm hover:bg-rose-600"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							) : (
								<UploadDropzone
									endpoint="serverImage"
									className="w-full"
									onClientUploadComplete={(res) => setImageUrl(res?.[0]?.url ?? null)}
								/>
							)}
						</div>
						<div className="space-y-2">
							<label htmlFor="profile-name" className="uppercase text-xs font-bold text-zinc-500">
								Display name
							</label>
							<Input
								id="profile-name"
								value={name}
								maxLength={40}
								disabled={isLoading}
								onChange={(e) => setName(e.target.value)}
								className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
							/>
						</div>
						{profile && (
							<p className="text-xs text-zinc-500">
								Member since {format(new Date(profile.createdAt), "d MMM yyyy")}
							</p>
						)}
						{error && <p className="text-sm text-rose-500">{error}</p>}
					</div>
					<DialogFooter className="bg-gray-100 px-6 py-4">
						<Button type="submit" variant="primary" disabled={isLoading} className="w-full">
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
