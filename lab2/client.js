const { Client } = require("hazelcast-client");

async function createClient() {
  return await Client.newHazelcastClient({
    clusterName: "dev",
    network: { clusterMembers: ["hz1:5701", "hz2:5701", "hz3:5701"] },
  });
}
module.exports = { createClient };
