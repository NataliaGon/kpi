package com.noa.counter.hz;

import com.hazelcast.map.MapLoader;
import com.hazelcast.map.MapStore;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

public class CounterStore implements MapLoader<Integer, Long>, MapStore<Integer, Long> {

  private final DataSource ds;

  // This is the ONLY constructor
  public CounterStore(DataSource ds) {
    this.ds = ds;
  }

  @Override
  public Long load(Integer key) {
    try (Connection c = ds.getConnection();
         PreparedStatement ps =
             c.prepareStatement("SELECT value FROM counters WHERE id=?")) {
      ps.setInt(1, key);
      try (ResultSet rs = ps.executeQuery()) {
        return rs.next() ? rs.getLong(1) : null;
      }
    } catch (SQLException e) {
      throw new RuntimeException("DB load failed for key=" + key, e);
    }
  }

  @Override
  public void store(Integer key, Long value) {
    try (Connection c = ds.getConnection();
         PreparedStatement ps =
             c.prepareStatement(
               "INSERT INTO counters(id,value) VALUES (?,?) " +
               "ON CONFLICT (id) DO UPDATE SET value=EXCLUDED.value")) {
      ps.setInt(1, key);
      ps.setLong(2, value);
      ps.executeUpdate();
    } catch (SQLException e) {
      throw new RuntimeException("DB store failed for key=" + key, e);
    }
  }

  @Override public void delete(Integer key) {}
  @Override public void storeAll(Map<Integer, Long> map) { map.forEach(this::store); }
  @Override public void deleteAll(Collection<Integer> keys) {}
  @Override public Map<Integer, Long> loadAll(Collection<Integer> keys) {
    Map<Integer, Long> out = new HashMap<>();
    keys.forEach(k -> out.put(k, load(k)));
    return out;
  }
  @Override public Iterable<Integer> loadAllKeys() { return null; }
}
