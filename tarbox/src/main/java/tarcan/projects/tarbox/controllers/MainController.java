package tarcan.projects.tarbox.controllers;

import org.hibernate.engine.jdbc.env.internal.LobCreationLogging_.logger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import tarcan.projects.tarbox.models.Game;
import tarcan.projects.tarbox.repositories.GameRepository;

/**
 * Web controller for the web views.
 */
@Controller
@RateLimiter(name = "tarbox-web")
public class MainController {

    Logger logger = LoggerFactory.getLogger(MainController.class);

    @Autowired
    GameRepository gameRepository;

    @GetMapping("/")
    public String main() {  
        return "home";
    }

    @GetMapping("/game/{gameId}")
    public String getGameView(Model model, @PathVariable Long gameId, @CookieValue(name = "tarbox_secret_code", required = false) String secretCode) {
        if(gameId == null || !gameRepository.existsById(gameId)) {
            return "redirect:/";
        }

        Game game = gameRepository.findByID(gameId).get();

        if(secretCode == null || !secretCode.equals(game.getSecretCode())) {
            return "redirect:/";
        }

        model.addAttribute("gameId", gameId);
        return "game";
    }

    @GetMapping("/download")
    public String downloadPage() {
        return "forward:/pages/download.html";
    }
    
}
