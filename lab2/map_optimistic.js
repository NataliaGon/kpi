// const { createClient } = require("./client");
const { Client } = require("hazelcast-client");
const { KEY, THREADS } = require("./constants");
ITER = 1000;
async function createClient() {
  return await Client.newHazelcastClient({
    clusterName: "dev",
    network: {
      clusterMembers: ["127.0.0.1:5701", "127.0.0.1:5702", "127.0.0.1:5703"],
    },
  });
}

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
  await Promise.all(
    Array.from({ length: THREADS }, async () => {
      for (let i = 0; i < ITER; i++) {
        await casIncrement(map, KEY);
        if (i % 25 === 0) console.log(`: ${i}/${ITER}`);
      }
    })
  );
  console.timeEnd("map-optimistic");

  console.log("Final (optimistic):", await map.get(KEY), "— expected 100000");
  await client.shutdown();
})();
