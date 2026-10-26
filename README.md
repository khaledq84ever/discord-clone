<div align="center">

<img src="logo.svg" alt="logo" width="300" height="250">

<h1 align="center" >Discord Clone</h1>

![cntr](https://img.shields.io/github/contributors/issam-seghir/discord-clone?color=pink&style=for-the-badge)
![pullreQ](https://img.shields.io/github/issues-pr/issam-seghir/discord-clone?color=orange&style=for-the-badge)
![comt](https://img.shields.io/github/last-commit/issam-seghir/discord-clone?style=for-the-badge)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)

![frk](https://img.shields.io/github/forks/issam-seghir/discord-clone?style=flat-square)
![str](https://img.shields.io/github/stars/issam-seghir/discord-clone?style=flat-square)
![deploy](https://img.shields.io/website?down_color=red&down_message=down&style=flat-square&up_color=succes&up_message=up&url=https%3A%2F%2Fdiscord-clone.vercel.app)

  <p align="center">

  **Discord Clone | A Full-Featured Real Time (Video , Audio , Chat) Application Powered by Next.js, Socket io , LiveKit**
  This project offers a robust and scalable solution for real-time communication,
  emulating the core functionalities of Discord with a modern tech stack.
    <br />
    <br />
    <!-- <a href="https://discord-clone-production-e15b.up.railway.app/">View Demo</a>-->
   <a href="https://discord-clone.koyeb.app">View Demo</a>
    .
    <a href="https://github.com/issam-seghir/discord-clone/issues">Report Bug</a>
    .
    <a href="https://github.com/issam-seghir/discord-clone/pulls">Request Feature</a>
  </p>

<br>
<hr>

</div>

<br>

![alt text](mockup-desktop.png)
![alt text](mockup-mobile.png)


### Built With

- ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
- ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
- ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
- ![Shadcn](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
- ![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-%23EC5990.svg?style=for-the-badge&logo=reacthookform&logoColor=white)
- ![Zustand](https://img.shields.io/badge/zustand-FFA351.svg?style=for-the-badge&logo=zustand&logoColor=white)
- ![Zod](https://img.shields.io/badge/zod-%233068b7.svg?style=for-the-badge&logo=zod&logoColor=white)
- ![uploadthing](https://img.shields.io/badge/uploadthing-B91C1C?style=for-the-badge&logo=upload%20thing)
- ![React Query](https://img.shields.io/badge/-React%20Query-FF4154?style=for-the-badge&logo=react%20query&logoColor=white)
- ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
- ![livekit](https://img.shields.io/badge/livekit-black?style=for-the-badge&logo=livekit)
- ![Prisma](https://img.shields.io/badge/Prisma-011627?style=for-the-badge&logo=prisma&logoColor=white)
- **Custom local authentication** (migrated off Clerk)

> **Stack note:** this fork runs **Next.js 16** (production build via `next build --webpack`) and **Prisma 7** with a **SQLite** dev database, served by a custom `server.mjs` (Next + Socket.io on the same port).

## Features

- 🔒 **Authentication** — custom **local auth** (email/password), migrated off Clerk
- 🎉 **Server** **creation** and customization
- 📱 **Real-time** messaging using **Socket.io**
- 📳**Websocket** **fallback**: **Polling** with alerts
- 🚀 **Create** **Text**, **Audio** and **Video** call **Channels**
- 📨 **Conversation** between members
- 🎬 **Video** **Calls** between members
- 🔊 **Audio** **Calls** between members
---
- 🎁 **Send** **attachments** as messages using **UploadThing**
- 🧨 **Delete** & **Edit** messages in **real time** for all users
- 🔰 **Member management** (**Kick**, Role change **Guest** / **Moderator**)
- 🔗 **Unique** **invite** **link** **generation** & full working invite system
- ⛓ **Infinite** **loading** for **messages** in batches of 10 (**@tanstack/query**)
- 🔍 **Search** **Command Line** Functionality
- 🎨 **Theme Toggler** (Light /Dark mode)
- 🚀 **Optimized SEO and Performance**: The project is optimized for SEO and performance using the latest Next.js features and best practices for **meta** tags and **Next/Image** && **site maps**.
- 🎊 **Responsive Design**



## Getting Started

First, run the development server:

> **Requirements:** Node.js and **pnpm** (the repo ships a `pnpm-lock.yaml`).

1. Clone or Fork the repo

   ```sh
   git clone https://github.com/khaledq84ever/discord-clone.git
   cd discord-clone
   ```

2. Install dependencies (the `postinstall` hook runs `prisma generate`)

   ```sh
   pnpm install
   ```

3. Copy `.env.example` to `.env` and fill it in. Required keys: `DATABASE_URL`
   (SQLite, e.g. `file:./dev.db`), `UPLOADTHING_TOKEN`, and `LIVEKIT_API_KEY` /
   `LIVEKIT_API_SECRET` / `NEXT_PUBLIC_LIVEKIT_URL`. **The `CLERK_*` keys are
   legacy and no longer used** (auth is now local).

4. Set up the database (migrate + seed)

   ```sh
   pnpm run setup
   ```

5. Start the dev server

   ```sh
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
Routes live under `src/app`.

### Production

`pnpm build` then `pnpm run serve` — this starts the custom `server.mjs`
(Next + Socket.io) on `$PORT` (defaults to 3000; the bundled PM2 config uses 3010).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.


## State
[![Stargazers over time](https://starchart.cc/issam-seghir/discord-clone.svg?variant=adaptive)](https://starchart.cc/issam-seghir/discord-clone)


## Support Me

<a href="https://www.buymeacoffee.com/issam.seghir" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy ma A Coffee" style="width: 174px !important;height: 41px !important;box-shadow: 0 3px 2px 0 rgb(190 190 190 / 50%) !important;" ></a>
</div>
