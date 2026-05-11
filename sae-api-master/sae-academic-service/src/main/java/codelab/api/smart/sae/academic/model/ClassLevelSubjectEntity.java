package codelab.api.smart.sae.academic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "ac_class_level_subject")
public class ClassLevelSubjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "class_level_id", nullable = false)
    private ClassLevelEntity classLevel;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private SubjectEntity subject;

    // null = todos os grupos; 'A', 'B', 'C' = grupo específico (11ª/12ª classe)
    @Column(name = "TURMA_GROUP")
    private String turmaGroup;

    public ClassLevelSubjectEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ClassLevelEntity getClassLevel() { return classLevel; }
    public void setClassLevel(ClassLevelEntity classLevel) { this.classLevel = classLevel; }

    public SubjectEntity getSubject() { return subject; }
    public void setSubject(SubjectEntity subject) { this.subject = subject; }

    public String getTurmaGroup() { return turmaGroup; }
    public void setTurmaGroup(String turmaGroup) { this.turmaGroup = turmaGroup; }
}
