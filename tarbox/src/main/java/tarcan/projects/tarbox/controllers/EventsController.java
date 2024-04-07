package tarcan.projects.tarbox.controllers;

import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import tarcan.projects.tarbox.enums.TarboxEventType;
import tarcan.projects.tarbox.models.TarboxEvent;
import tarcan.projects.tarbox.repositories.StatisticRepository;

import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("api/app/event")
public class EventsController {

    Logger logger = LoggerFactory.getLogger(EventsController.class);

    @Autowired
    StatisticRepository statistics;
    
    @GetMapping("/download")
    public String getDownloadStats(@NonNull @RequestParam String os) {
        JSONObject response = new JSONObject();

        TarboxEventType givenStatisticType;
        try {
            givenStatisticType = TarboxEventType.valueOf(os);
        }
        catch(IllegalArgumentException e) {
            response.put("error", "The statistic is not valid");
            return ResponseEntity.badRequest().body(response).toString();
        }
        catch (Exception e) {
            response.put("error", "An error occured.");
            return ResponseEntity.badRequest().body(response).toString();
        }
        
        List<TarboxEvent> readStatistic = statistics.findAllByStatisticType(givenStatisticType);
        response.put("event", givenStatisticType.getTypeString());
        response.put("count", readStatistic.size());
        return ResponseEntity.ok(response).toString();
    }

    @PostMapping("/download")
    public String writeDownloadStat(@RequestBody String os, HttpServletRequest request) {
        logger.info("Write download called with os " + os);
        logger.info(request.getRequestURL().toString());
        JSONObject response = new JSONObject();
        if(os == null) {
            response.put("error", "Invalid request");
            return ResponseEntity.badRequest().body(response).toString();
        }

        JSONObject deserializedBody = new JSONObject(os);
        String eventType = deserializedBody.getString("event");

        TarboxEventType givenStatisticType;
        logger.info("Starting...");
        try {
            givenStatisticType = TarboxEventType.valueOf(eventType);
            logger.info(givenStatisticType.getTypeString());
        }
        catch(IllegalArgumentException e) {
            logger.info(e.getMessage());
            response.put("error", "The statistic is not valid");
            return ResponseEntity.badRequest().body(response).toString();
        }
        catch (Exception e) {
            logger.info(e.getMessage());
            response.put("error", "An error occured.");
            return ResponseEntity.badRequest().body(response).toString();
        }
        
        TarboxEvent toBeCreatedStatistic = new TarboxEvent();
        toBeCreatedStatistic.setStatisticType(givenStatisticType);
        logger.info(givenStatisticType.getTypeString());
        try {
            statistics.save(toBeCreatedStatistic);
            logger.info("Write successful.");
        }
        catch(Exception e) {
            response.put("error", "An error occured.");
            return ResponseEntity.badRequest().body(response).toString();
        }
        response.put("event", givenStatisticType.getTypeString());
        return ResponseEntity.ok(response).toString();
    }
    
    
}
