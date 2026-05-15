package codelab.api.smart.sae.quiz.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_question")
public class QuizQuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private QuizEntity quiz;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String enunciado;

    private Integer ordemNumero = 0;

    /** URL do ficheiro de media (imagem/vídeo) no MinIO, null se não houver */
    @Column(columnDefinition = "TEXT")
    private String mediaUrl;

    /** Tipo de media: IMAGE, VIDEO ou null */
    @Column(length = 10)
    private String mediaType;

    /** Explicação da resposta correta gerada por IA */
    @Column(columnDefinition = "TEXT")
    private String explicacao;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("letra ASC")
    private List<QuizOptionEntity> options = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QuizEntity getQuiz() { return quiz; }
    public void setQuiz(QuizEntity quiz) { this.quiz = quiz; }
    public String getEnunciado() { return enunciado; }
    public void setEnunciado(String enunciado) { this.enunciado = enunciado; }
    public Integer getOrdemNumero() { return ordemNumero; }
    public void setOrdemNumero(Integer ordemNumero) { this.ordemNumero = ordemNumero; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getExplicacao() { return explicacao; }
    public void setExplicacao(String explicacao) { this.explicacao = explicacao; }
    public List<QuizOptionEntity> getOptions() { return options; }
    public void setOptions(List<QuizOptionEntity> options) { this.options = options; }
}
