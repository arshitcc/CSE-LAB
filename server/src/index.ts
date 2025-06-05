import express from "express";
import dotenv from "dotenv";
import logger from "./loggers/winston.logger";
import { connectDB } from "./db/db";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 6969;
const app = express();

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
