const { createClient } = require("./client");
const { KEY, THREADS, ITER } = require("./constants");

(async () => {
  const client = await createClient();
  const map = await client.getMap("counters");
  await map.put(KEY, 0);

  console.time("map-pessimistic");

  const worker = async () => {
    for (let i = 0; i < ITER; i++) {
      await map.lock(KEY);
      try {
        const v = await map.get(KEY);
        await map.put(KEY, v + 1);
      } finally {
        await map.unlock(KEY);
      }
    }
  };
  const workers = [];
  for (let i = 0; i < THREADS; i++) {
    workers.push(worker(i));
  }
  await Promise.all(workers);

  console.timeEnd("map-pessimistic");

  console.log("Final (pessimistic):", await map.get(KEY), "— expected 100000");
  await client.shutdown();
})();
