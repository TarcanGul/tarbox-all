package tarcan.projects.tarbox.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tarcan.projects.tarbox.models.Game;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    Optional<Game> findByID(Long ID);
}
