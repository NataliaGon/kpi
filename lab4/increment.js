const { MongoClient } = require("mongodb");

const uri =
  "mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/?replicaSet=rs0";
db.likes.insertOne({ _id: "post1", likes: 0 });

async function run(wc) {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db("perfTest");
  const col = db.collection("likes");

  const loops = 10000;
  const start = Date.now();

  for (let i = 0; i < loops; i++) {
    await col.findOneAndUpdate(
      { _id: "post1" },
      { $inc: { likes: 1 } },
      { writeConcern: { w: wc } }
    );
  }

  const seconds = (Date.now() - start) / 1000;
  console.log(`PID=${process.pid} wc=${wc} done in ${seconds.toFixed(2)}s`);

  await client.close();
}

const wcArg = process.argv[2] || "1";
const wc = wcArg === "majority" ? "majority" : Number(wcArg);

run(wc).catch((err) => {
  console.error("ERROR in client", err);
  process.exit(1);
});
