"use client";

import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import {
	ControlBar,
	GridLayout,
	LiveKitRoom,
	ParticipantTile,
	RoomAudioRenderer,
	StartAudio,
	TrackToggle,
	useConnectionState,
	useIsMuted,
		useIsSpeaking,
	useLocalParticipant,

		useParticipants,
	useRoomContext,

	useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState, Participant, Track } from "livekit-client";
import { Headphones, HeadphoneOff, Loader2, PhoneOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MediaRoomProps {
	serverId: string;
	chatId: string;
	video: boolean;
	audio: boolean;
}

// Signaling goes through this app's own origin (server.mjs proxies /livekit to the
// LiveKit server), so voice keeps working when the public tunnel URL changes.
function livekitUrl() {
	if (process.env.NEXT_PUBLIC_LIVEKIT_URL) return process.env.NEXT_PUBLIC_LIVEKIT_URL;
	return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/livekit`;
}

export function MediaRoom({ serverId, chatId, video, audio }: MediaRoomProps) {
		const router = useRouter();
	const [token, setToken] = useState("");
	const [deafened, setDeafened] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const resp = await fetch(`/api/get-participant-token?room=${encodeURIComponent(chatId)}`);
				const data = await resp.json();
				if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
				if (!cancelled) setToken(data.token);
			} catch (e: any) {
				if (!cancelled) setError(e?.message || "Could not join the room");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [chatId]);

	if (error) {
		return (
			<div className="flex flex-col flex-1 justify-center items-center gap-2 px-6 text-center">
				<p className="text-sm text-rose-500">Could not join voice: {error}</p>
			</div>
		);
	}

	if (token === "") {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
				<p className="text-zinc-500 dark:text-zinc-400 text-xs">Connecting...</p>
			</div>
		);
	}

	return (
		<LiveKitRoom
			video={video}
			audio={audio}
			token={token}
			serverUrl={livekitUrl()}
			connect={true}
			options={{ adaptiveStream: true, dynacast: true }}
			onDisconnected={() => router.push(`/servers/${serverId}`)}
			data-lk-theme="default"
			className="relative flex flex-col flex-1 min-h-0"
		>
			{video ? <VideoStage /> : <VoiceStage deafened={deafened} onToggleDeafen={() => setDeafened((d) => !d)} />}
			<RoomAudioRenderer muted={deafened} />
			{/* Mobile browsers block autoplay until the user taps; this shows only when needed. */}
			<StartAudio
				label="Tap to hear the room"
				className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
			/>
		</LiveKitRoom>
	);
}

function VideoStage() {
	// Camera placeholders keep a tile for everyone, even with their camera off.
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
		],
		{ onlySubscribed: false }
	);
	return (
		<>
			<GridLayout tracks={tracks} className="flex-1 min-h-0">
				<ParticipantTile />
			</GridLayout>
			<ControlBar className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
		</>
	);
}

function VoiceStage({ deafened, onToggleDeafen }: { deafened: boolean; onToggleDeafen: () => void }) {
	const participants = useParticipants();
	const state = useConnectionState();

	return (
		<div className="flex flex-1 min-h-0 flex-col bg-[#313338]">
			<div className="flex-1 min-h-0 overflow-y-auto p-4">
				{state !== ConnectionState.Connected && (
					<p className="mb-3 text-center text-xs text-zinc-400">
						{state === ConnectionState.Reconnecting ? "Reconnecting…" : "Connecting…"}
					</p>
				)}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{participants.map((p) => (
						<VoiceTile key={p.identity} participant={p} />
					))}
				</div>
			</div>
			<div className="flex items-center justify-center gap-3 border-t border-zinc-700 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
								<TrackToggle
					source={Track.Source.Microphone}
					showIcon
					className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-zinc-700 px-4 text-white hover:bg-zinc-600 data-[lk-enabled=false]:bg-rose-600"
				>
					<MicLabel />
				</TrackToggle>
				<button
					type="button"
					onClick={onToggleDeafen}
					aria-pressed={deafened}
					aria-label={deafened ? "Undeafen" : "Deafen"}
					className={cn(
						"flex h-12 items-center justify-center gap-2 rounded-full px-4 text-white",
						deafened ? "bg-rose-600 hover:bg-rose-700" : "bg-zinc-700 hover:bg-zinc-600"
					)}
				>
					{deafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
					<span className="hidden sm:inline">{deafened ? "Undeafen" : "Deafen"}</span>
				</button>
				<LeaveButton />
			</div>
		</div>
	);
}

function MicLabel() {
	const { localParticipant } = useLocalParticipant();
	return <span className="hidden sm:inline">{localParticipant.isMicrophoneEnabled ? "Mute" : "Unmute"}</span>;
}

function VoiceTile({ participant }: { participant: Participant }) {
	const speaking = useIsSpeaking(participant);
	const muted = useIsMuted({ participant, source: Track.Source.Microphone });
	let imageUrl: string | undefined;
	try {
		imageUrl = JSON.parse(participant.metadata || "{}").imageUrl ?? undefined;
	} catch {}
	const name = participant.name || participant.identity;

	return (
		<div className="flex flex-col items-center gap-2 rounded-lg bg-zinc-800/80 p-4">
			<div
				className={cn(
					"rounded-full ring-4 ring-offset-2 ring-offset-zinc-800 transition",
					speaking && !muted ? "ring-emerald-500" : "ring-transparent"
				)}
			>
				<UserAvatar src={imageUrl} name={name} className="h-16 w-16 md:h-16 md:w-16" />
			</div>
			<p className="max-w-full truncate text-sm font-semibold text-zinc-100">
				{name}
				{participant.isLocal && <span className="font-normal text-zinc-400"> (you)</span>}
			</p>
			<p className="text-xs text-zinc-400">{muted ? "Muted" : speaking ? "Speaking" : "Listening"}</p>
		</div>
	);
}

function LeaveButton() {
	const room = useRoomContext();
	// Disconnecting triggers LiveKitRoom's onDisconnected, which navigates away.
	return (
		<button
			type="button"
			aria-label="Leave voice"
			onClick={() => room.disconnect()}
			className="flex h-12 items-center justify-center gap-2 rounded-full bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700"
		>
			<PhoneOff className="h-5 w-5" />
			<span className="hidden sm:inline">Leave</span>
		</button>
	);
}
