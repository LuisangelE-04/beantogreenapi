/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { httpServerHandler } from "cloudflare:node";
import express from "express";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import kioskRoutes from './routes/kiosk';
import surveysRoutes from './routes/surveys';
import leaderboardRoutes from './routes/leaderboard';
import { authenticate } from "./middleware/auth";
import cors from "cors";
import { refreshLeaderboard } from "./services/leaderboardService";

const app = express()

// Middleware to parse JSON bodies
app.use(cors())
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
	res.json({ message: "Express.js running on Cloudflare Workers! This is the bean to green API used for the PWA under development! 🫛"})
})

app.use("/api/users", authenticate, userRoutes);
app.use("/api/auth", authRoutes)
app.use("/api/kiosk", kioskRoutes);
app.use("/api/surveys", surveysRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.listen(3000);

const handler = httpServerHandler({ port: 3000 });

export default {
	fetch: (handler as any).fetch ?? (handler as any),
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(
			refreshLeaderboard()
				.then(() => console.log("Scheduled leaderboard refresh completed"))
				.catch((error) => console.error("Scheduled leaderboard refresh failed:", error))
		);
	}
};
