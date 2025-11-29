from cassandra.cluster import Cluster
from cassandra import ConsistencyLevel
from concurrent.futures import ThreadPoolExecutor
import time


CONTACT_POINTS = ["127.0.0.1"]  
KEYSPACE = "ks_rf3"
TABLE = "likes_counter"

NUM_CLIENTS = 10
INCREMENTS_PER_CLIENT = 10_000
ROW_ID = 1      


CL_NAMES = {
    ConsistencyLevel.ONE: "ONE",
    ConsistencyLevel.QUORUM: "QUORUM",
}


def setup_schema(session):
    """Create table if needed and reset counter to 0."""
    create_table = f"""
        CREATE TABLE IF NOT EXISTS {KEYSPACE}.{TABLE} (
            id int PRIMARY KEY,
            likes counter
        );
    """
    session.execute(create_table)

    session.execute(f"TRUNCATE {KEYSPACE}.{TABLE}")

    session.execute(
        f"UPDATE {KEYSPACE}.{TABLE} "
        f"SET likes = likes + 0 WHERE id = %s",
        (ROW_ID,)
    )


def run_test(session, consistency):
    """Run one experiment for a given consistency level."""
    cl_name = CL_NAMES.get(consistency, str(consistency))
    print(f"\n=== Running test with consistency = {cl_name} ===")

    update_cql = (
        f"UPDATE {KEYSPACE}.{TABLE} "
        f"SET likes = likes + ? WHERE id = ?"
    )
    prepared = session.prepare(update_cql)

    def worker():
        for _ in range(INCREMENTS_PER_CLIENT):
            bound = prepared.bind((1, ROW_ID))  
            bound.consistency_level = consistency
            session.execute(bound)

    start = time.time()

    with ThreadPoolExecutor(max_workers=NUM_CLIENTS) as executor:
        for _ in range(NUM_CLIENTS):
            executor.submit(worker)

    duration = time.time() - start


    select_cql = (
        f"SELECT likes FROM {KEYSPACE}.{TABLE} WHERE id = %s"
    )
    row = session.execute(select_cql, (ROW_ID,)).one()
    final_value = row.likes if row else None

    print(f"Expected final value: {NUM_CLIENTS * INCREMENTS_PER_CLIENT}")
    print(f"Actual final value  : {final_value}")
    print(f"Execution time (s)  : {duration:.2f}")

    return duration, final_value


if __name__ == "__main__":
    cluster = Cluster(CONTACT_POINTS)
    session = cluster.connect(KEYSPACE)

    setup_schema(session)

    run_test(session, ConsistencyLevel.ONE)


    try:
        run_test(session, ConsistencyLevel.QUORUM)
    except Exception as e:
        print("\nQUORUM test failed:", e)
        print("This can happen because replication_factor = 3 "
              "but not enough replicas are alive.")

    cluster.shutdown()
