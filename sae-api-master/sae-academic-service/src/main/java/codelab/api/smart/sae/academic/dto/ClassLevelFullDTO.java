package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;
import java.util.List;

public class ClassLevelFullDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private List<ClassroomFullDTO> classrooms;

    public ClassLevelFullDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String name() { return name; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<ClassroomFullDTO> getClassrooms() { return classrooms; }
    public void setClassrooms(List<ClassroomFullDTO> classrooms) { this.classrooms = classrooms; }
}
