# ---------- build ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
# если есть: COPY gradle.properties ./

RUN chmod +x ./gradlew

# чтобы зависимости кешировались отдельно от исходников
RUN ./gradlew --no-daemon dependencies || true

# теперь копируем исходники
COPY src src

RUN ./gradlew --no-daemon clean bootJar -x test

# ---------- run ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
