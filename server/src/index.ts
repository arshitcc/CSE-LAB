import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morganMiddleware from "./loggers/morgan.logger";
import { errorHandler } from "./middlewares/error.middleware";
import { CORS_ORIGIN } from "./utils/env";
import logger from "./loggers/winston.logger";
import { connectDB } from "./db/db";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 6969;
const app = express();

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

import healthCheckRouter from "./app/routes/healthcheck/route";
import authRouter from "./app/routes/auth/route";
import problemsRouter from "./app/routes/problem/route";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", authRouter);
app.use("/api/v1/problems", problemsRouter);

app.route("/").get((req: Request, res: Response) => {
  res.status(200).send("Server is running");
});

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`⚙️  Server is running on PORT: ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error(
      "Failed to start server because Prisma could not connect:",
      error,
    );
  });
export default app;
