package com.noa.counter.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

  @Bean
  public DataSource dataSource() {
    String url = env("DB_URL", "jdbc:postgresql://localhost:5432/counterdb");
    String user = env("DB_USER", "counter");
    String pass = env("DB_PASSWORD", "counter");

    HikariConfig cfg = new HikariConfig();
    cfg.setJdbcUrl(url);
    cfg.setUsername(user);
    cfg.setPassword(pass);
    cfg.setMaximumPoolSize(10);
    cfg.setMinimumIdle(1);
    cfg.setConnectionTimeout(10_000);
    cfg.setPoolName("counter-pool");

    return new HikariDataSource(cfg);
  }

  private static String env(String k, String def) {
    String v = System.getenv(k);
    return (v == null || v.isBlank()) ? def : v;
  }
}
