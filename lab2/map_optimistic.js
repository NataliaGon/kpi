const { createClient } = require("./client");
const { ITER, KEY, THREADS } = require("./constants");

async function casIncrement(map, key) {
  while (true) {
    const oldVal = await map.get(key);
    const ok = await map.replaceIfSame(key, oldVal, oldVal + 1);

    if (ok) return;
  }
}

(async () => {
  const client = await createClient();
  const map = await client.getMap("counters");
  await map.put(KEY, 0);

  console.time("map-optimistic");

  const worker = async () => {
    for (let i = 0; i < ITER; i++) {
      await casIncrement(map, KEY);
    }
  };

  const workers = [];
  for (let i = 0; i < THREADS; i++) {
    workers.push(worker(i));
  }
  await Promise.all(workers);

  console.timeEnd("map-optimistic");

  console.log("Final (optimistic):", await map.get(KEY), "— expected 100000");
  await client.shutdown();
})();
