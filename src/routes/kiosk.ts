import { Router, Request, Response } from "express";
import { query } from "../db/pool";

const kioskRoutes = Router();

kioskRoutes.post("/verify-login", async (req: Request, res: Response) => {

});

kioskRoutes.post("/donation", async (req: Request, res: Response) => {
  // main focus for now using the physical scale to weigh coffee grounds
  
});
