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

// ALTERNATIVE: server-express-cluster.js" (Node + Express + Cluster)

// const cluster = require("node:cluster");
// const os = require("node:os");
// const express = require("express");
// const port = 8080;

// if (cluster.isPrimary) {
//   let count = 0;
//   const n = os.cpus().length;
//   for (let i = 0; i < n; i++) cluster.fork();

//   cluster.on("message", (worker, msg) => {
//     if (!msg) return;
//     if (msg.type === "inc") {
//       count += 1; // single place → atomic globally
//       worker.send({ type: "inc:ack", id: msg.id });
//     } else if (msg.type === "get") {
//       worker.send({ type: "get:res", id: msg.id, value: count });
//     }
//   });
// } else {
//   const app = express();
//   let seq = 0;
//   const pending = new Map();

//   function askMaster(type) {
//     return new Promise((resolve) => {
//       const id = `${process.pid}-${seq++}`;
//       pending.set(id, resolve);
//       process.send({ type, id });
//     });
//   }

//   process.on("message", (msg) => {
//     const cb = pending.get(msg.id);
//     if (cb) {
//       pending.delete(msg.id);
//       cb(msg);
//     }
//   });

//   app.get("/inc", async (_req, res) => {
//     await askMaster("inc");
//     res.end("OK");
//   });
//   app.get("/count", async (_req, res) => {
//     const r = await askMaster("get");
//     res.end(String(r.value));
//   });

//   app.listen(port, () => console.log(`Worker ${process.pid} on ${port}`));
// }
