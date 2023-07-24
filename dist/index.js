"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const TransferSchema_1 = __importDefault(require("./utils/TransferSchema"));
const connectToDb_1 = __importDefault(require("./utils/connectToDb"));
const Sentry = __importStar(require("@sentry/node"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("combined"));
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
app.post("/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    if (body.confirmed) {
        return res.status(200).json();
    }
    const newTransfers = [];
    body.erc20Transfers.forEach((transfer) => {
        newTransfers.push({
            fromAddress: transfer.from,
            toAddress: transfer.to,
            value: transfer.value,
            valueWithDecimals: transfer.valueWithDecimals,
        });
    });
    if (newTransfers.length > 0) {
        yield TransferSchema_1.default.insertMany(newTransfers);
        console.log(`Added new to transfers to db`);
    }
    res.status(200).json();
}));
app.use(Sentry.Handlers.errorHandler());
// Optional fallthrough error handler
app.use(function onError(err, req, res) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Internal server error");
});
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
(0, connectToDb_1.default)().then(() => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
});
//# sourceMappingURL=index.js.map