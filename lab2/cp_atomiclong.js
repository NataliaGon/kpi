const { createClient } = require("./client");
const { THREADS, ITER } = require("./constants");

(async () => {
  const client = await createClient();

  const cp = client.getCPSubsystem();
  const counter = await cp.getAtomicLong("likes");

  await counter.set(0);

  console.time("atomicLong");

  const worker = async () => {
    for (let i = 0; i < ITER; i++) {
      await counter.incrementAndGet();
    }
  };

  const workers = [];
  for (let i = 0; i < THREADS; i++) {
    workers.push(worker(i));
  }
  await Promise.all(workers);

  console.timeEnd("atomicLong");

  console.log("Final value:", await counter.get());

  await client.shutdown();
})();
