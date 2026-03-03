import {Router, Request, Response } from "express";

const userRoutes = Router();

userRoutes.get("/user", (req, res) => {
  res.json({message: "User information"});
});

userRoutes.patch("/user", (req, res) => {
  res.json({message: "Updated account information"});
});

export default userRoutes;