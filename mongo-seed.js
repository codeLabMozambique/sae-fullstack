// ============================================================
// SAE - SEED MongoDB para CONTENT-SERVICE
// Base de dados: sae_content
// Correr com:
//   docker exec -i sae-mongodb mongosh sae_content < mongo-seed.js
// Ou (mongosh local):
//   mongosh "mongodb://localhost:27017/sae_content" mongo-seed.js
//
// Idempotente: só cria documentos se não existirem (verifica por nome).
// ============================================================

print("=== Seeding MongoDB sae_content ===");

// ------------------------------------------------------------
// 1. CATEGORIAS (árvore hierárquica)
// ------------------------------------------------------------

// Garante que a colecção existe
db.createCollection("categories", { capped: false }) || null;

// Helper idempotente
function upsertCategory(name, description, parentId) {
    const existing = db.categories.findOne({ name: name, parent_id: parentId });
    if (existing) {
        print("  [skip] " + name + " já existe");
        return existing._id;
    }
    const result = db.categories.insertOne({
        name: name,
        description: description,
        parent_id: parentId
    });
    print("  [ok] " + name + " (" + result.insertedId + ")");
    return result.insertedId;
}

print("--- Categorias raíz ---");
const matRoot   = upsertCategory("Matemática",       "Materiais de Matemática",       null);
const portRoot  = upsertCategory("Português",        "Língua Portuguesa",             null);
const fisRoot   = upsertCategory("Física",           "Ciências Físicas",              null);
const quiRoot   = upsertCategory("Química",          "Química Geral e Orgânica",      null);
const histRoot  = upsertCategory("História",         "História de Moçambique e Universal", null);
const bioRoot   = upsertCategory("Biologia",         "Ciências da Vida",              null);
const ingRoot   = upsertCategory("Inglês",           "English Language",              null);
const infoRoot  = upsertCategory("Informática",      "Computação e Tecnologia",       null);

print("--- Subcategorias ---");
// Matemática
upsertCategory("Álgebra",       "Equações e expressões",         matRoot.toString());
upsertCategory("Geometria",     "Formas, áreas e volumes",       matRoot.toString());
upsertCategory("Trigonometria", "Razões trigonométricas",        matRoot.toString());
upsertCategory("Cálculo",       "Cálculo Diferencial e Integral",matRoot.toString());

// Português
upsertCategory("Gramática",      "Regras gramaticais",           portRoot.toString());
upsertCategory("Literatura",     "Análise de obras literárias",  portRoot.toString());
upsertCategory("Redação",        "Composição e produção textual",portRoot.toString());

// Física
upsertCategory("Mecânica",       "Cinemática e dinâmica",         fisRoot.toString());
upsertCategory("Electromagnetismo","Electricidade e magnetismo",  fisRoot.toString());

// Informática
upsertCategory("Programação",    "Algoritmos e linguagens",       infoRoot.toString());
upsertCategory("Bases de Dados", "SQL e modelação",               infoRoot.toString());
upsertCategory("Redes",          "Protocolos e arquitetura",      infoRoot.toString());

// ------------------------------------------------------------
// 2. ÍNDICES (garantir que existem mesmo sem auto-index-creation)
// Silencioso: ignora erros quando o índice já existe.
// ------------------------------------------------------------
print("--- Garantir índices ---");

function safeIndex(coll, keys, opts) {
    try {
        db[coll].createIndex(keys, opts || {});
        print("  [ok] " + coll + " idx " + JSON.stringify(keys));
    } catch (e) {
        print("  [skip] " + coll + " idx " + JSON.stringify(keys) + " (" + e.codeName + ")");
    }
}

safeIndex("favorites",        { user_id: 1, content_id: 1 }, { unique: true, name: "user_content_fav_uniq" });
safeIndex("reading_progress", { user_id: 1, content_id: 1 }, { unique: true, name: "user_content_uniq" });
safeIndex("contents",         { title: "text", description: "text" }, { weights: { title: 3, description: 1 }, name: "contents_text_idx" });
safeIndex("contents",         { discipline: 1 });
safeIndex("contents",         { level: 1 });
safeIndex("contents",         { uploaded_by: 1 });
safeIndex("reading_history",  { user_id: 1, read_at: -1 });
safeIndex("attachments",      { uploaded_by: 1 });
safeIndex("attachments",      { context: 1, context_id: 1 });

print("--- Resumo ---");
print("categories:        " + db.categories.countDocuments());
print("contents:          " + db.contents.countDocuments());
print("favorites:         " + db.favorites.countDocuments());
print("reading_progress:  " + db.reading_progress.countDocuments());
print("reading_history:   " + db.reading_history.countDocuments());
print("study_goals:       " + db.study_goals.countDocuments());
print("attachments:       " + db.attachments.countDocuments());

print("=== Seed concluído ===");
