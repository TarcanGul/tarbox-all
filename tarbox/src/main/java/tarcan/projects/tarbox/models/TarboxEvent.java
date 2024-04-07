package tarcan.projects.tarbox.models;

import io.github.resilience4j.core.lang.NonNull;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tarcan.projects.tarbox.enums.TarboxEventType;

@Entity
@Table(name = "tarbox_events")
@NoArgsConstructor
public class TarboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Getter
    private Long ID;
    
    @Column(name = "event_type")
    @Getter
    @Setter
    @NonNull 
    private TarboxEventType statisticType;
}
