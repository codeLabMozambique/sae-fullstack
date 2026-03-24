# Stage 1: Build
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY sae-common/pom.xml sae-common/
COPY sae-auth-service/pom.xml sae-auth-service/
# ... copy other poms if needed for dependency resolution
RUN mvn dependency:go-offline -B

COPY sae-common/src sae-common/src
COPY sae-auth-service/src sae-auth-service/
RUN mvn clean package -pl sae-auth-service -am -DskipTests

# Stage 2: Runtime
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/sae-auth-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
