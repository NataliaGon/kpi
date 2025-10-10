const { createClient } = require("./client");
const { KEY, THREADS, ITER } = require("./constants");

(async () => {
  const client = await createClient();

  const cp = client.getCPSubsystem();
  const counter = await cp.getAtomicLong("likes");

  await counter.set(0);

  console.time("atomicLong");
  await Promise.all(
    Array.from({ length: THREADS }, async () => {
      for (let i = 0; i < ITER; i++) {
        await counter.incrementAndGet();
      }
    })
  );
  console.timeEnd("atomicLong");

  console.log("Final value:", await counter.get());

  await client.shutdown();
})();
