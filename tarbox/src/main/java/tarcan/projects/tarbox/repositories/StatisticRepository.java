package tarcan.projects.tarbox.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tarcan.projects.tarbox.models.TarboxEvent;
import java.util.List;
import tarcan.projects.tarbox.enums.TarboxEventType;


@Repository
public interface StatisticRepository extends JpaRepository<TarboxEvent, Long> {
    List<TarboxEvent> findAllByStatisticType(TarboxEventType statisticType);
}
