FROM amazoncorretto:17-alpine3.19

WORKDIR /tarbox-app

COPY . .

CMD [ "./mvnw", "spring-boot:run", "-Dspring.active.profile=docker" ]