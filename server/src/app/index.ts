import app from "..";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morganMiddleware from "../loggers/morgan.logger";
import { errorHandler } from "../middlewares/error.middleware";
import { CORS_ORIGIN } from "../utils/env";

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morganMiddleware);

import healthCheckRouter from "./routes/healthcheck/route";
import authRouter from "./routes/auth/route";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", authRouter);


app.route("/").get((req: Request, res: Response) => {
  res.status(200).send("Server is running");
});

app.use(errorHandler);
