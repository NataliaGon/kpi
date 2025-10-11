const { createClient } = require("./client");
const { KEY, THREADS, ITER } = require("./constants");

(async () => {
  const client = await createClient();
  const map = await client.getMap("counters");
  await map.put(KEY, 0);

  console.time("map-no-lock");
  const worker = async () => {
    for (let i = 0; i < ITER; i++) {
      const v = await map.get(KEY);
      await map.put(KEY, v + 1);
    }
  };

  const workers = [];
  for (let i = 0; i < THREADS; i++) {
    workers.push(worker(i));
  }
  await Promise.all(workers);

  console.timeEnd("map-no-lock");

  console.log("Final (no-lock):", await map.get(KEY), "— expected < 100000");
  await client.shutdown();
})();
