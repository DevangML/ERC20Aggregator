const express = require("express");
import { Application, Request, Response, NextFunction } from "express";
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const Transfer = require("./utils/TransferSchema").Transfers;
const connectToDB = require("./utils/db").connectToDB;

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));

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

  await connectToDB();

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
    await Transfer.insertMany(newTransfers);
    console.log(`Added new to transfers to db`);
  }

  res.status(200).json();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).send("Internal server error");
});

// Start server
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(port, (): void => {
  console.log(`Server listening on port ${port}`);
});
