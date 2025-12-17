package com.noa.counter.hz;

import com.hazelcast.map.EntryProcessor;

import java.io.Serializable;
import java.util.Map;

/** Atomic increment on the Hazelcast member thread. */
public class IncEntryProcessor implements EntryProcessor<Integer, Long, Long>, Serializable {
  @Override
  public Long process(Map.Entry<Integer, Long> entry) {
    Long cur = entry.getValue();
    if (cur == null) cur = 0L;        // if missing in cache, write-through will persist the first write
    long next = cur + 1L;
    entry.setValue(next);
    return next;
  }
}
