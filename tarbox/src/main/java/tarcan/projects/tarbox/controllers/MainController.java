package tarcan.projects.tarbox.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import tarcan.projects.tarbox.repositories.GameRepository;

/**
 * Web controller for the web views.
 */
@Controller
public class MainController {

    @Autowired
    GameRepository gameRepository;

    @GetMapping("/")
    public String main() {  
        return "home";
    }

    @GetMapping("/game/{gameId}")
    public String getGameView(Model model, @PathVariable Long gameId) {
        if(!gameRepository.existsById(gameId)) {
            return "home";
        }
        model.addAttribute("gameId", gameId);
        return "game";
    }
}
