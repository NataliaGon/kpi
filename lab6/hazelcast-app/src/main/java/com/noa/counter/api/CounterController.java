package com.noa.counter.api;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import com.noa.counter.hz.IncEntryProcessor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class CounterController {

  private final IMap<Integer, Long> counters;

  public CounterController(HazelcastInstance hz) {
    this.counters = hz.getMap("counters");
    // Ensure 4 counters exist (IDs 1..4) with initial value 0.
    // With write-through, these "putIfAbsent" calls create rows in DB.
    for (int i = 1; i <= 4; i++) {
      counters.putIfAbsent(i, 0L);
    }
  }

 @GetMapping("/inc/{id}")
public String inc(@PathVariable("id") int id) {
    Long next = counters.executeOnKey(id, new IncEntryProcessor());
    return "Incremented to " + next;
}

@GetMapping("/count/{id}")
public String count(@PathVariable("id") int id) {
    Long v = counters.get(id);
    return String.valueOf(v == null ? 0L : v);
}

  @PostMapping("/reset")
  public Map<Integer, Long> reset() {
    for (int i = 1; i <= 4; i++) counters.set(i, 0L);
    return Map.of(
        1, counters.get(1),
        2, counters.get(2),
        3, counters.get(3),
        4, counters.get(4)
    );
  }
}
