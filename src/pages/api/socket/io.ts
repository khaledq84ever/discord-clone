import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types/server";

export const config = {
	api: {
		bodyParser: false,
	},
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
	if (!res.socket.server.io) {
		(res.socket.server as any).io = (res.socket.server as any).io ?? undefined;
	}
	res.end();
};

export default ioHandler;