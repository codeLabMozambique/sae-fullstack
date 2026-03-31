package codelab.api.smart.sae.academic.model;

import codelab.api.smart.sae.framework.jpa.UpdatableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "ac_CLASSROOM")
public class ClassroomEntity extends UpdatableEntity {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME", nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = false)
    private SchoolEntity school;

    @ManyToOne
    @JoinColumn(name = "class_level_id", nullable = false)
    private ClassLevelEntity classLevel;

    @Column(name = "SHIFT")
    private String shift;

    @Column(name = "ACADEMIC_YEAR")
    private String academicYear;

    @Column(name = "IS_ACTIVE")
    private boolean active = true;

    public ClassroomEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public SchoolEntity getSchool() { return school; }
    public void setSchool(SchoolEntity school) { this.school = school; }

    public ClassLevelEntity getClassLevel() { return classLevel; }
    public void setClassLevel(ClassLevelEntity classLevel) { this.classLevel = classLevel; }

    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
