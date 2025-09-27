// PART2 : server.js (Node + Express + Postgres)

const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const port = process.env.PORT || 8880;
const app = express();

dotenv.config();

const pool = new Pool({
  connectionString: process.env.NEON_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/inc", async function (req, res) {
  const result = await pool.query(
    "UPDATE counter SET value = value + 1 WHERE id = 1 RETURNING value"
  );
  res.send("Incremented to " + result.rows[0].value);
});

app.get("/count", async function (req, res) {
  const result = await pool.query("SELECT value FROM counter WHERE id = 1");
  res.send("Count is " + result.rows[0].value);
});

app.listen(port);

// PART1 : server-express.js (pure Node + Express)
// const express = require("express");
// const port = process.env.PORT || 8880;
// const app = express();

// count = 0;
// app.get("/inc", function (req, res) {
//   count++;
//   res.send("Incremented");
// });

// app.get("/count", function (req, res) {
//   res.send("Count is " + count);
// });

// app.listen(port);

//PART1 ALTERNATIVE WITH WORKERS

// const express = require("express");
// const { Worker } = require("worker_threads");
// const os = require("os");

// const app = express();
// const port = process.env.PORT || 8880;

// const shared = new SharedArrayBuffer(4);
// const counter = new Int32Array(shared);

// const W = Math.max(2, Math.min(os.cpus().length, 8));
// const workers = Array.from(
//   { length: W },
//   () =>
//     new Worker(
//       `
//   const { parentPort, workerData } = require('worker_threads');
//   const counter = new Int32Array(workerData.shared);
//   parentPort.on('message', () => {
//     // incrementAndGet(): Atomics.add returns OLD value, so +1
//     const newVal = Atomics.add(counter, 0, 1) + 1;
//     parentPort.postMessage(newVal);
//   });
// `,
//       { eval: true, workerData: { shared } }
//     )
// );

// let idx = 0;
// function incViaWorker() {
//   return new Promise((resolve) => {
//     const w = workers[idx];
//     idx = (idx + 1) % workers.length;
//     const onMsg = (val) => {
//       w.off("message", onMsg);
//       resolve(val);
//     };
//     w.on("message", onMsg);
//     w.postMessage("inc");
//   });
// }

// app.get("/inc", async (_req, res) => {
//   try {
//     const val = await incViaWorker(); // multiple threads increment safely
//     res.end("Incremented to " + val);
//   } catch (e) {
//     console.error(e);
//     res.statusCode = 500;
//     res.end("error");
//   }
// });

// app.get("/count", (_req, res) => {
//   res.end(String(Atomics.load(counter, 0))); // atomic read
// });

// app.listen(port, () => {
//   console.log(`Listening on http://localhost:${port}  | workers: ${W}`);
// });
