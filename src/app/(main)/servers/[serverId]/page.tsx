import { getCurrentProfile, getGeneralServer } from "@/lib/query";

import { redirect } from "next/navigation";

interface ServerIdPageProps {
	params: Promise<{
		serverId: string;
	}>;
}

export default async function ServerIdPage(props: ServerIdPageProps) {
    const params = await props.params;
    const profile = await getCurrentProfile();
    if (!profile) {
		return redirect("/sign-in");
	}
    const generalServer = await getGeneralServer(params.serverId, profile.id);

    if(generalServer){
        redirect(`/servers/${params.serverId}/channels/${generalServer?.channels?.[0]?.id}`);
    }
    if (!generalServer) {
        return redirect("/sign-in");
    }
    return <div>New server</div>;
}
