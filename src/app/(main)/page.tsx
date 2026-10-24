import { UserDetails } from "@/components/user/user-details";
import { ModeToggle } from "@/components/mode-toggler";
import { initProfile, getFirstServer } from "@/lib/query";
import {InitialModel} from "@/components/modals/initial-model";
import Image from "next/image";




export default async function Home() {
	const profile = await initProfile();
	console.log(profile);

	const server = await getFirstServer(profile.id);

	return (
		<>
			<main className="max-w-[75rem] w-full mx-auto">
				<div className="grid grid-cols-[1fr_20.5rem] gap-10 pb-10">
					<div>
						<header className="flex items-center justify-between w-full h-16 gap-4">
							<div className="flex gap-4">
								<ModeToggle />
							</div>
							<div className="flex items-center gap-2">
								<div className="size-6 rounded-full overflow-hidden">
									<Image
										src={profile.imageUrl || "/icon.png"}
										alt="avatar"
										width={24}
										height={24}
										className="size-6 object-cover"
									/>
								</div>
							</div>
						</header>
						{!server && <InitialModel />}
						<UserDetails />
					</div>
				</div>
			</main>
		</>
	);
}
