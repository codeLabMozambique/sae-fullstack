import 'api_client.dart';

class ForumQuestion {
  final int id;
  final String titulo;
  final String? descricao;
  final String? questionType; // ESPECIALIZADO / COLABORATIVO
  final String? status;       // ABERTA / RESPONDIDA
  final String? disciplina;
  final String? autorUsername;
  final String? autorNome;
  final String? createdAt;

  ForumQuestion({
    required this.id,
    required this.titulo,
    this.descricao,
    this.questionType,
    this.status,
    this.disciplina,
    this.autorUsername,
    this.autorNome,
    this.createdAt,
  });

  factory ForumQuestion.fromJson(Map<String, dynamic> j) => ForumQuestion(
        id: (j['id'] as num).toInt(),
        titulo: j['titulo'] ?? j['title'] ?? '',
        descricao: j['descricao'] ?? j['description'],
        questionType: j['questionType'],
        status: j['status'],
        disciplina: j['disciplina'] is String ? j['disciplina'] : (j['disciplina']?['name']),
        autorUsername: j['autorUsername'] ?? j['createdBy'],
        autorNome: j['autorNome'] ?? j['createdByName'],
        createdAt: j['createdAt']?.toString(),
      );
}

class ForumAnswer {
  final int id;
  final String? texto;
  final String? autorNome;
  final String? autorUsername;
  final String? createdAt;
  final bool aceita;

  ForumAnswer({
    required this.id,
    this.texto,
    this.autorNome,
    this.autorUsername,
    this.createdAt,
    this.aceita = false,
  });

  factory ForumAnswer.fromJson(Map<String, dynamic> j) => ForumAnswer(
        id: (j['id'] as num).toInt(),
        texto: j['texto'] ?? j['descricao'] ?? j['content'],
        autorNome: j['autorNome'] ?? j['createdByName'],
        autorUsername: j['autorUsername'] ?? j['createdBy'],
        createdAt: j['createdAt']?.toString(),
        aceita: j['aceita'] == true || j['accepted'] == true,
      );
}

class QuestionDetail {
  final ForumQuestion question;
  final List<ForumAnswer> expertAnswers;
  final List<ForumAnswer> collaborativeAnswers;
  QuestionDetail({required this.question, required this.expertAnswers, required this.collaborativeAnswers});

  factory QuestionDetail.fromJson(Map<String, dynamic> j) {
    final ea = (j['expertAnswers'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final ca = (j['collaborativeAnswers'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    return QuestionDetail(
      question: ForumQuestion.fromJson(j),
      expertAnswers: ea.map(ForumAnswer.fromJson).toList(),
      collaborativeAnswers: ca.map(ForumAnswer.fromJson).toList(),
    );
  }
}

class ForumService {
  final _api = ApiClient.instance.dio;

  Future<List<ForumQuestion>> list({String? questionType, String? status, int page = 0, int size = 30}) async {
    final res = await _api.get('/forum/questions', queryParameters: {
      if (questionType != null) 'questionType': questionType,
      if (status != null) 'status': status,
      'page': page,
      'size': size,
    });
    final data = res.data as Map<String, dynamic>;
    final items = (data['content'] as List).cast<Map<String, dynamic>>();
    return items.map(ForumQuestion.fromJson).toList();
  }

  Future<List<ForumQuestion>> myQuestions() async {
    final res = await _api.get('/forum/questions/mine');
    return (res.data as List).cast<Map<String, dynamic>>().map(ForumQuestion.fromJson).toList();
  }

  Future<List<ForumQuestion>> professorPending() async {
    final res = await _api.get('/forum/questions/professor/pending');
    return (res.data as List).cast<Map<String, dynamic>>().map(ForumQuestion.fromJson).toList();
  }

  Future<List<ForumQuestion>> professorAnswered() async {
    final res = await _api.get('/forum/questions/professor/answered');
    return (res.data as List).cast<Map<String, dynamic>>().map(ForumQuestion.fromJson).toList();
  }

  Future<QuestionDetail> get(int id) async {
    final res = await _api.get('/forum/questions/$id');
    return QuestionDetail.fromJson(res.data as Map<String, dynamic>);
  }

  Future<ForumQuestion> create({
    required String titulo,
    required String descricao,
    required String questionType, // ESPECIALIZADO / COLABORATIVO
    String? disciplina,
  }) async {
    final endpoint = questionType == 'COLABORATIVO'
        ? '/forum/questions/collaborative'
        : '/forum/questions';
    final res = await _api.post(endpoint, data: {
      'titulo': titulo,
      'descricao': descricao,
      'questionType': questionType,
      if (disciplina != null) 'disciplina': disciplina,
    });
    return ForumQuestion.fromJson(res.data as Map<String, dynamic>);
  }

  Future<ForumAnswer> answerExpert(int questionId, String texto) async {
    final res = await _api.post('/forum/questions/$questionId/expert-answers', data: {'texto': texto});
    return ForumAnswer.fromJson(res.data as Map<String, dynamic>);
  }

  Future<ForumAnswer> answerCollaborative(int questionId, String texto) async {
    final res = await _api.post('/forum/collaborative/questions/$questionId/answers', data: {'texto': texto});
    return ForumAnswer.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> accept(int answerId) =>
      _api.put('/forum/expert-answers/$answerId/accept');
}
