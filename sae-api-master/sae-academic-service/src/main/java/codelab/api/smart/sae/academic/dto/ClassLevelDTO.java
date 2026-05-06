package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;

public class ClassLevelDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;

    public ClassLevelDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
