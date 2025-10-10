const { createClient } = require("./client");
const { KEY, THREADS, ITER } = require("./constants");

(async () => {
  const client = await createClient();
  const map = await client.getMap("counters");
  await map.put(KEY, 0);

  console.time("map-no-lock");
  const worker = async (id) => {
    for (let i = 0; i < ITER; i++) {
      const v = await map.get(KEY);
      await map.put(KEY, v + 1);
      if (i % 25 === 0) console.log(`w${id}: ${i}/${ITER}`);
    }
  };

  await Promise.all(Array.from({ length: THREADS }, (_, i) => worker(i)));
  console.timeEnd("map-no-lock");

  console.log("Final (no-lock):", await map.get(KEY), "— expected < 100000");
  await client.shutdown();
})();
