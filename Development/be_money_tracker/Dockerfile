# ===== Multi-stage build for Spring Boot =====
# Stage 1: build the JAR with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache dependencies first
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

# Build the project
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# Stage 2: minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the fat jar from builder
COPY --from=builder /app/target/moneytracker-0.0.1-SNAPSHOT.jar app.jar

# Railway sets PORT env var; default 8080
EXPOSE 8080

# Health check (Railway respects this)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-8080}/actuator/health || exit 1

# Run with the prod profile. Railway injects PORT.
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Dspring.profiles.active=prod -jar app.jar"]
