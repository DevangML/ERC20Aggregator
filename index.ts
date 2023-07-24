import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import Transfers from "./utils/TransferSchema";
import connectToDB from "./utils/connectToDb";
import * as Sentry from "@sentry/node";

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));

Sentry.init({
  dsn: "https://7f1565f0626349e0bb5c340adaf2aab6@o968057.ingest.sentry.io/4505578280976384",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({
      tracing: true,
    }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({
      app,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!,
});

// Trace incoming requests
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

interface ERC20Transfer {
  from: string;
  to: string;
  value: number;
  valueWithDecimals: number;
}

interface WebhookBody {
  confirmed: boolean;
  erc20Transfers: ERC20Transfer[];
}

app.post("/webhook", async (req: Request, res: Response) => {
  const { body } = req as { body: WebhookBody };

  if (body.confirmed) {
    return res.status(200).json();
  }

  const newTransfers: any[] = [];

  body.erc20Transfers.forEach((transfer) => {
    newTransfers.push({
      fromAddress: transfer.from,
      toAddress: transfer.to,
      value: transfer.value,
      valueWithDecimals: transfer.valueWithDecimals,
    });
  });

  if (newTransfers.length > 0) {
    await Transfers.insertMany(newTransfers);
    console.log(`Added new to transfers to db`);
  }

  res.status(200).json();
});

app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err: any, req: any, res: any) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Internal server error");
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

connectToDB().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
