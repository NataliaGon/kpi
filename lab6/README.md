# Task 1 Advanced — Hazelcast caching (Read-through + Write-through)

Implements `counters` as a Hazelcast `IMap<Integer, Long>` backed by PostgreSQL using:
- **Read-through** via `MapLoader` (`load` / `loadAll`)
- **Write-through** via `MapStore` (`store`), with `writeDelaySeconds=0`

The service exposes:
- `GET /inc/{id}` — atomic increment (EntryProcessor) for counter **id = 1..4**
- `GET /count/{id}` — read current value (read-through if not in cache)
- `POST /reset` — reset all counters to 0

## 1) Run

```bash
docker compose up --build
```

Service: `http://localhost:8880`

## 2) Verify that 4 rows appeared in DB (IDs 1..4, value=0)

```bash
docker exec -it $(docker ps -qf name=db) psql -U counter -d counterdb -c "SELECT * FROM counters ORDER BY id;"
```

## 3) Quick manual check

```bash
curl -s http://localhost:8880/count/1; echo
curl -s http://localhost:8880/inc/1; echo
curl -s http://localhost:8880/count/1; echo
```

## 4) Repeat tests 1–4 from Lab1 (counter 1..4)

Run:

```bash
bash tests/run_lab1_tests.sh
```

At the end, check DB:

```bash
docker exec -it $(docker ps -qf name=db) psql -U counter -d counterdb -c "SELECT * FROM counters ORDER BY id;"
```

You should see:
- counter 1 increased by 10,000
- counter 2 increased by 20,000
- counter 3 increased by 50,000
- counter 4 increased by 100,000
(assuming you ran the script once after a reset)

## Notes

- Hazelcast increments happen on the member thread via `EntryProcessor`, so the result is correct even with concurrent clients.
- DB writes are done on each update (write-through) to make DB values always up-to-date.
