package com.noa.counter.config;

import com.hazelcast.config.*;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import com.noa.counter.hz.CounterStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class HazelcastConfig {

  @Bean(destroyMethod = "shutdown")
  public HazelcastInstance hazelcastInstance(DataSource ds) {
     System.out.println(">>> HazelcastConfig.java IS BEING USED <<<");

    String clusterName = env("HZ_CLUSTER_NAME", "dev");

    Config cfg = new Config();
    cfg.setClusterName(clusterName);

    // Docker-friendly discovery: join by TCP/IP (service name = hazelcast-app)
    NetworkConfig net = cfg.getNetworkConfig();
    net.setPort(5701).setPortAutoIncrement(true);

    JoinConfig join = net.getJoin();
    join.getMulticastConfig().setEnabled(false);
    join.getTcpIpConfig()
        .setEnabled(true)
        .addMember("hazelcast-app"); // you can scale this service to multiple replicas

    // MAP: counters (backed by DB via MapStore/MapLoader)
    MapConfig mapConfig = new MapConfig("counters");
    mapConfig.setBackupCount(1);

    MapStoreConfig ms = new MapStoreConfig();
    ms.setEnabled(true);
    ms.setWriteDelaySeconds(0); // write-through
    ms.setImplementation(new CounterStore(ds)); // generic MapLoader + MapStore
    mapConfig.setMapStoreConfig(ms);

    // Optional: keep data hot
    mapConfig.setTimeToLiveSeconds(0);
    mapConfig.setMaxIdleSeconds(0);

    cfg.addMapConfig(mapConfig);

    return Hazelcast.newHazelcastInstance(cfg);
  }

  private static String env(String k, String def) {
    String v = System.getenv(k);
    return (v == null || v.isBlank()) ? def : v;
  }
}
