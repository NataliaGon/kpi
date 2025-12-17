FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV JAVA_OPTS=""
COPY --from=build /app/target/hazelcast-counter.jar /app/app.jar
EXPOSE 8880 5701
CMD ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
