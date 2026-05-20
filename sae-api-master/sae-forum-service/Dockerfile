FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY sae-common/pom.xml sae-common/
COPY sae-forum-service/pom.xml sae-forum-service/
COPY sae-auth-service/pom.xml sae-auth-service/
COPY sae-academic-service/pom.xml sae-academic-service/
COPY sae-api-gateway/pom.xml sae-api-gateway/
COPY sae-content-service/pom.xml sae-content-service/
COPY sae-quiz-service/pom.xml sae-quiz-service/
COPY sae-ai-service/pom.xml sae-ai-service/

COPY sae-common/src sae-common/src
COPY sae-forum-service/src sae-forum-service/src

RUN mvn clean package -pl sae-forum-service -am -DskipTests -B

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/sae-forum-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
