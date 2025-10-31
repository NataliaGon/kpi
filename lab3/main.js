import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const THREADS = 10;
const ITERATIONS = 10000;
const USER_ID = 1;
const pool = new Pool({
  connectionString: process.env.LOCAL_URL,
});

async function resetCounter() {
  await pool.query(
    "UPDATE user_counter SET counter = 0, version = 0 WHERE user_id = $1",
    [USER_ID]
  );
}

async function readCounter() {
  const res = await pool.query(
    "SELECT counter, version FROM user_counter WHERE user_id = $1",
    [USER_ID]
  );
  return res.rows[0];
}

/* 1. LOST UPDATE */
async function lostUpdateClient() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < ITERATIONS; i++) {
      await client.query("BEGIN");
      const res = await client.query(
        "SELECT counter FROM user_counter WHERE user_id = $1",
        [USER_ID]
      );
      const newVal = res.rows[0].counter + 1;
      await client.query(
        "UPDATE user_counter SET counter = $1 WHERE user_id = $2",
        [newVal, USER_ID]
      );
      await client.query("COMMIT");
    }
  } catch (err) {
    console.error("lostUpdateClient error:", err);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

async function runLostUpdate() {
  console.log("\n=== LOST UPDATE ===");
  await resetCounter();
  const start = Date.now();

  const clients = [];
  for (let i = 0; i < THREADS; i++) {
    clients.push(lostUpdateClient());
  }
  await Promise.all(clients);

  const end = Date.now();
  const { counter } = await readCounter();
  console.log("Time:", end - start, "ms");
  console.log("Final counter (will be < THREADS*ITERATIONS):", counter);
}

/* 2. SERIALIZABLE */
async function serializableClient() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < ITERATIONS; i++) {
      while (true) {
        try {
          await client.query("BEGIN");
          await client.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
          const res = await client.query(
            "SELECT counter FROM user_counter WHERE user_id = $1",
            [USER_ID]
          );
          const newVal = res.rows[0].counter + 1;
          await client.query(
            "UPDATE user_counter SET counter = $1 WHERE user_id = $2",
            [newVal, USER_ID]
          );
          await client.query("COMMIT");
          break;
        } catch (err) {
          await client.query("ROLLBACK");
          if (err.code !== "40001") {
            console.error("serializableClient error:", err);
            break;
          }
        }
      }
    }
  } finally {
    client.release();
  }
}

async function runSerializable() {
  console.log("\n=== SERIALIZABLE ===");
  await resetCounter();
  const start = Date.now();

  const clients = [];
  for (let i = 0; i < THREADS; i++) {
    clients.push(serializableClient());
  }
  await Promise.all(clients);

  const end = Date.now();
  const { counter } = await readCounter();
  console.log("Time:", end - start, "ms");
  console.log("Final counter (must be 100k when ITERATIONS=10000):", counter);
}

/* 3. IN-PLACE UPDATE */
async function inPlaceClient() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < ITERATIONS; i++) {
      await client.query("BEGIN");
      await client.query(
        "UPDATE user_counter SET counter = counter + 1 WHERE user_id = $1",
        [USER_ID]
      );
      await client.query("COMMIT");
    }
  } finally {
    client.release();
  }
}

async function runInPlace() {
  console.log("\n=== IN-PLACE UPDATE ===");
  await resetCounter();
  const start = Date.now();

  const clients = [];
  for (let i = 0; i < THREADS; i++) {
    clients.push(inPlaceClient());
  }
  await Promise.all(clients);

  const end = Date.now();
  const { counter } = await readCounter();
  console.log("Time:", end - start, "ms");
  console.log("Final counter (must be correct):", counter);
}

/* 4. ROW-LEVEL LOCK */
async function rowLockClient() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < ITERATIONS; i++) {
      await client.query("BEGIN");
      const res = await client.query(
        "SELECT counter FROM user_counter WHERE user_id = $1 FOR UPDATE",
        [USER_ID]
      );
      const newVal = res.rows[0].counter + 1;
      await client.query(
        "UPDATE user_counter SET counter = $1 WHERE user_id = $2",
        [newVal, USER_ID]
      );
      await client.query("COMMIT");
    }
  } finally {
    client.release();
  }
}

async function runRowLock() {
  console.log("\n=== ROW-LEVEL LOCK ===");
  await resetCounter();
  const start = Date.now();

  const clients = [];
  for (let i = 0; i < THREADS; i++) {
    clients.push(rowLockClient());
  }
  await Promise.all(clients);

  const end = Date.now();
  const { counter } = await readCounter();
  console.log("Time:", end - start, "ms");
  console.log("Final counter (must be correct):", counter);
}

/* 5. OPTIMISTIC CONCURRENCY */
async function optimisticClient() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < ITERATIONS; i++) {
      while (true) {
        await client.query("BEGIN");
        const res = await client.query(
          "SELECT counter, version FROM user_counter WHERE user_id = $1",
          [USER_ID]
        );
        const { counter, version } = res.rows[0];
        const newVal = counter + 1;

        const upd = await client.query(
          `UPDATE user_counter
           SET counter = $1, version = $2
           WHERE user_id = $3 AND version = $4`,
          [newVal, version + 1, USER_ID, version]
        );
        await client.query("COMMIT");

        if (upd.rowCount > 0) {
          // success
          break;
        }
        // else retry
      }
    }
  } finally {
    client.release();
  }
}

async function runOptimistic() {
  console.log("\n=== OPTIMISTIC CONCURRENCY ===");
  await resetCounter();
  const start = Date.now();

  const clients = [];
  for (let i = 0; i < THREADS; i++) {
    clients.push(optimisticClient());
  }
  await Promise.all(clients);

  const end = Date.now();
  const { counter, version } = await readCounter();
  console.log("Time:", end - start, "ms");
  console.log("Final counter (must be correct):", counter, "version:", version);
}

// await runLostUpdate();
// await runSerializable();
// await runInPlace();
// await runRowLock();
await runOptimistic();
await pool.end();
