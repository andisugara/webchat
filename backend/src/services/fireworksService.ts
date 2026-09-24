import axios from 'axios';
import dotenv from 'dotenv';
import { RetrievedChunk } from './ragService';

dotenv.config();

const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY || '';
const FIREWORKS_MODEL = process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/gpt-oss-120b';

export interface ChatCompletionResult {
  reply: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  modelName: string;
  retrievedSources: Array<{ title: string; category: string; sourceUrl: string | null; score: number }>;
}

/**
 * Builds the dynamic system prompt containing ONLY the top retrieved chunks
 */
function buildSystemPrompt(retrievedChunks: RetrievedChunk[], visitorName?: string): string {
  const contextSection = retrievedChunks.length > 0
    ? retrievedChunks.map((c, i) => `[Info ${i + 1}: ${c.title} (${c.category})]\n${c.chunkText}`).join('\n\n---\n\n')
    : 'Tidak ada dokumen spesifik yang dilampirkan.';

  return `Anda adalah SITA AI Assistant, asisten customer service virtual resmi dari Portal Sistem Informasi Pariwisata (SITA) Kabupaten Badung, Bali.

PRINSIP KEPRIBADIAN & GAYA KOMUNIKASI (SANGAT KRUSIAL):
1. **Ramah & Hangat (Hospitality Bali):** Sapa pengunjung dengan hangat dan sopan (misal: "Om Swastyastu Kak ${visitorName || 'Sahabat Wisata'}" atau "Halo Kak ${visitorName || 'Sahabat Wisata'}"). Gunakan bahasa Indonesia yang luwes, empatik, santun, dan alami layaknya customer service manusia di aplikasi live chat modern.
2. **Format Chat Ringkas & Nyaman Dibaca (ANTI WALL OF TEXT / ANTI RAW DUMP):**
   - Jawab secara to the point, ringkas, dan komunikatif (maksimal 2-3 paragraf pendek atau poin-poin ringkas).
   - DILARANG mencetak ulang seluruh artikel mentah / dokumentasi panjang / rangkuman ensiklopedia yang kaku.
   - DILARANG menggunakan heading markdown besar seperti "### Atraksi Utama", "### Fasilitas Pendukung", "### Jadwal Operasional". Gunakan penekanan tebal (**teks**) atau bullet point sederhana (•) jika diperlukan.
   - DILARANG membuat tabel markdown yang lebar (| col | col |), sederhanakan informasi harga atau jadwal menjadi teks mengalir atau poin ringkas.
3. **Penanganan Kehilangan Barang / Fasilitas Rusak / Keluhan Wisatawan:**
   - Tunjukkan rasa empati mendalam terlebih dahulu jika pengunjung kehilangan barang atau mengalami kendala (misal: "Duh, mohon maaf sekali dan turut prihatin atas kehilangan ponselnya di area Pura Uluwatu ya Kak...").
   - JANGAN menyuruh pengunjung pergi ke website lain atau menelepon 112 jika sedang berada di ruang chat ini.
   - Tawarkan bantuan untuk langsung membuatkan tiket laporan pengaduan/kehilangan resmi sekarang agar diteruskan ke tim Tourism Helpdesk Badung dan petugas di lokasi.
   - Contoh respons kehilangan: "Apakah Kakak ingin saya bantu buatkan tiket laporan kehilangan resmi sekarang? Cukup konfirmasi 'Ya, tolong buatkan' atau infokan ciri-ciri barangnya, nanti tiket laporan resmi langsung kami terbitkan untuk Kakak."
4. **Diferensiasi Tiket:**
   - Bedakan dengan tegas antara "tiket masuk tempat wisata" (misal tiket GWK, Uluwatu, Pantai Pandawa) dengan "tiket layanan pengaduan/laporan". Jangan pernah memberikan prosedur pengaduan jika pengunjung hanya menanyakan harga tiket masuk wisata!
5. **Penutup:**
   - Selalu akhiri jawaban dengan tawaran bantuan lanjutan yang ramah dan terbuka (misal: "Ada hal lain yang ingin Kakak tanyakan seputar rute atau tips wisatanya?").

=== DATA RESMI SEBAGAI REFERENSI ===
${contextSection}
====================================`;
}

/**
 * Intelligent conversational response generator for fallback / local testing
 */
function generateFallbackResponse(
  userMessage: string,
  retrievedChunks: RetrievedChunk[],
  visitorName?: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
): string {
  const lower = userMessage.toLowerCase().trim();
  const name = visitorName || 'Sahabat Wisata';

  // Combine with recent history to understand follow-ups
  const recentUserHistory = history.filter(h => h.role === 'user').map(h => h.content.toLowerCase()).join(' ');
  const combinedContext = `${recentUserHistory} ${lower}`;

  // 1. Lost items / complaints flow
  if (
    lower.includes('hilang') ||
    lower.includes('kehilangan') ||
    lower.includes('tertinggal') ||
    lower.includes('ketinggalan') ||
    lower.includes('kecopetan') ||
    lower.includes('jatuh')
  ) {
    let loc = '';
    if (combinedContext.includes('uluwatu')) loc = 'Pura Uluwatu';
    else if (combinedContext.includes('kuta')) loc = 'Pantai Kuta';
    else if (combinedContext.includes('gwk')) loc = 'GWK Cultural Park';
    else if (combinedContext.includes('pandawa')) loc = 'Pantai Pandawa';
    else if (combinedContext.includes('canggu')) loc = 'Kawasan Canggu';
    else if (combinedContext.includes('seminyak')) loc = 'Kawasan Seminyak';
    else if (combinedContext.includes('tanah lot')) loc = 'Tanah Lot';

    let item = 'barang';
    if (lower.includes('hp') || lower.includes('handphone') || lower.includes('ponsel') || lower.includes('smartphone')) item = 'ponsel/HP';
    else if (lower.includes('dompet')) item = 'dompet';
    else if (lower.includes('tas')) item = 'tas';
    else if (lower.includes('kunci')) item = 'kunci';
    else if (lower.includes('kamera')) item = 'kamera';

    if (loc) {
      return `Om Swastyastu Kak ${name}. Aduh, mohon maaf sekali dan turut prihatin atas kejadian kehilangan ${item} di area **${loc}**.\n\nApakah Kakak ingin saya bantu buatkan tiket laporan kehilangan resmi ke tim Tourism Helpdesk Badung dan petugas lapangan di ${loc} sekarang?\n\nCukup balas **"Ya, tolong buatkan"** atau berikan info tambahan (seperti warna/ciri khusus), nanti tiket laporan resmi langsung kami terbitkan untuk Kakak.`;
    }

    return `Om Swastyastu Kak ${name}. Mohon maaf sekali atas kendala kehilangan yang Kakak alami. Agar kami dapat langsung membantu menerbitkan tiket laporan resmi ke petugas lapangan, boleh tolong infokan ${item === 'barang' ? 'barang apa yang hilang dan ' : ''}di area wisata mana kejadiannya Kak?`;
  }

  // 2. Entrance ticket inquiries (GWK, Taman Ayun, Uluwatu, Pandawa, dll.)
  if (
    lower.includes('tiket') ||
    lower.includes('harga') ||
    lower.includes('tarif') ||
    lower.includes('biaya') ||
    lower.includes('bayar berapa')
  ) {
    // GWK (Garuda Wisnu Kencana)
    if (combinedContext.includes('gwk') || combinedContext.includes('garuda wisnu kencana')) {
      return `Om Swastyastu Kak ${name}! Untuk harga tiket masuk **Garuda Wisnu Kencana (GWK Cultural Park)** di Ungasan saat ini:\n\n` +
        `• **Wisatawan Domestik (WNI):** Rp 125.000 (Dewasa) / Rp 100.000 (Anak-anak)\n` +
        `• **Wisatawan Mancanegara (WNA):** Rp 200.000 (Dewasa) / Rp 150.000 (Anak-anak)\n\n` +
        `Tiket ini sudah termasuk akses ke seluruh area taman budaya, Plaza Wisnu, serta menonton pertunjukan tari Kecak & Barong harian. Buka setiap hari pukul 09.00 - 21.00 WITA. Ada hal lain yang ingin Kakak tanyakan seputar GWK?`;
    }

    // Pura Taman Ayun
    if (combinedContext.includes('taman ayun') || combinedContext.includes('mengwi')) {
      return `Om Swastyastu Kak ${name}! Harga tiket masuk **Pura Taman Ayun Mengwi** adalah Rp 15.000/orang (WNI) dan Rp 30.000/orang (WNA). Retribusi parkir motor Rp 2.000 dan mobil Rp 5.000. Buka setiap hari pukul 08.00 - 18.00 WITA.`;
    }

    // Pura Uluwatu & Tari Kecak
    if (combinedContext.includes('uluwatu') || combinedContext.includes('kecak')) {
      return `Om Swastyastu Kak ${name}! Untuk tiket di kawasan **Pura Uluwatu**:\n\n` +
        `• **Tiket Masuk Pura:** Rp 30.000 (WNI) / Rp 50.000 (WNA)\n` +
        `• **Tiket Pertunjukan Tari Kecak Sunset:** Rp 150.000 per orang\n\n` +
        `Pertunjukan tari Kecak dimulai setiap sore pukul 18.00 WITA di amfiteater tebing dengan panorama matahari terbenam. Ingin dibantu info lainnya seputar Uluwatu?`;
    }

    // General ticket pricing summary
    return `Om Swastyastu Kak ${name}! Berikut ringkasan harga tiket masuk destinasi favorit di Kabupaten Badung:\n\n` +
      `• **GWK Cultural Park:** Rp 125.000 (WNI) / Rp 200.000 (WNA)\n` +
      `• **Pura Uluwatu:** Rp 30.000 (WNI) | Tiket Tari Kecak: Rp 150.000\n` +
      `• **Pura Taman Ayun:** Rp 15.000 (WNI) / Rp 30.000 (WNA)\n` +
      `• **Pantai Pandawa:** Rp 8.000 (WNI) / Rp 15.000 (WNA)\n` +
      `• **Pantai Kuta & Jimbaran:** Gratis biaya masuk (hanya parkir).\n\n` +
      `Ada destinasi tertentu yang ingin Kakak ketahui lebih lengkap?`;
  }

  // 3. GWK General / Facilities / Attractions Inquiry (Warm & Human-like, no encyclopedia dump)
  if (combinedContext.includes('gwk') || combinedContext.includes('garuda wisnu')) {
    return `Om Swastyastu Kak ${name}! Di **Garuda Wisnu Kencana (GWK) Cultural Park**, daya tarik utamanya adalah kemegahan patung Dewa Wisnu setinggi 121 meter karya Nyoman Nuarta dan Plaza Wisnu dengan panorama taman yang luas dan indah.\n\n` +
      `Selain itu, terdapat pertunjukan tari Kecak & Barong harian, spot foto Lotus Pond, area Street Theater, beragam resto & kafe, serta toko suvenir khas Bali. Fasilitasnya sangat lengkap mulai dari area parkir luas, shuttle bus, hingga pusat informasi wisata.\n\n` +
      `Tiket masuknya Rp 125.000 (WNI) / Rp 200.000 (WNA), buka setiap hari pukul 09.00 - 21.00 WITA. Apakah ada informasi jadwal pertunjukan atau rute ke sana yang ingin Kakak ketahui?`;
  }

  // 4. Small talk & Casual greetings
  if (lower.match(/^(halo|hai|hey|hi|hello|pagi|siang|sore|malam|om swastyastu|tes|test)/i)) {
    return `Om Swastyastu! Halo Kak ${name}, ada yang bisa saya bantu terkait destinasi wisata, harga tiket masuk, atau layanan di Kabupaten Badung hari ini?`;
  }

  if (lower.includes('lagi apa') || lower.includes('sedang apa') || lower.includes('lagi ngapain')) {
    return `Saya sedang siap bertugas membantu Kak ${name} seputar info pariwisata Badung, rekomendasi pantai, tiket destinasi, hingga bantuan layanan pengaduan. Ada yang ingin Kakak tanyakan?`;
  }

  // 5. Popular destinations
  if (
    lower.includes('rame') ||
    lower.includes('ramai') ||
    lower.includes('populer') ||
    lower.includes('favorit') ||
    lower.includes('terkenal') ||
    lower.includes('wisata apa')
  ) {
    return `Beberapa destinasi wisata paling favorit dan ramai di Kabupaten Badung saat ini antara lain:\n\n` +
      `1. **GWK Cultural Park** di Ungasan – Taman budaya megah dengan patung 121m & tari Kecak harian.\n` +
      `2. **Pura Uluwatu** di Pecatu – Wisata tebing spektakuler dengan sunset dan pentas Kecak.\n` +
      `3. **Pantai Kuta, Seminyak & Canggu** – Pusat sunset, pantai pasir putih, dan beach club hits.\n` +
      `4. **Pantai Kedonganan Jimbaran** – Kuliner seafood bakar tepi pantai saat matahari terbenam.\n` +
      `5. **Pura Taman Ayun Mengwi** – Pura peninggalan Kerajaan Mengwi berstatus Warisan Dunia UNESCO.\n\n` +
      `Ada destinasi yang menarik perhatian Kakak untuk dikunjungi?`;
  }

  // 6. Retrieved chunks synthesis (Conversational, max 2-3 short paragraphs)
  if (retrievedChunks.length > 0) {
    const top = retrievedChunks[0];
    // Clean any giant headers or markdown tables from raw chunk
    let cleanChunk = top.chunkText
      .replace(/###\s+/g, '')
      .replace(/##\s+/g, '')
      .replace(/\|[^\n]+\|/g, '')
      .replace(/-{3,}/g, '')
      .trim();
    
    // Take first 2-3 sentences/paragraphs
    const lines = cleanChunk.split('\n').filter(l => l.trim().length > 0).slice(0, 3).join('\n\n');
    return `Om Swastyastu Kak ${name}! Berikut informasi mengenai **${top.title}**:\n\n${lines}\n\nApakah ada detail spesifik lain yang ingin Kakak ketahui seputar ${top.title}?`;
  }

  return `Om Swastyastu Kak ${name}! Saya siap membantu memberikan info lengkap seputar pariwisata Kabupaten Badung, mulai dari rekomendasi pantai, tiket masuk, pura bersejarah, hingga layanan pengaduan wisata. Ada yang bisa saya bantu?`;
}

/**
 * Calls Fireworks AI Chat Completion with RAG Context & Token Tracking
 */
export async function generateChatReply(
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  retrievedChunks: RetrievedChunk[],
  visitorName?: string
): Promise<ChatCompletionResult> {
  const startTime = Date.now();
  const systemPrompt = buildSystemPrompt(retrievedChunks, visitorName);

  const sourcesSummary = retrievedChunks.map((c) => ({
    title: c.title,
    category: c.category,
    sourceUrl: c.sourceUrl,
    score: c.score,
  }));

  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
  ];

  if (FIREWORKS_API_KEY && FIREWORKS_API_KEY.trim().length > 0) {
    try {
      const response = await axios.post(
        'https://api.fireworks.ai/inference/v1/chat/completions',
        {
          model: FIREWORKS_MODEL,
          messages: messagesPayload,
          temperature: 0.6,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${FIREWORKS_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      const latencyMs = Date.now() - startTime;
      const data = response.data;
      const choice = data.choices?.[0];
      const reply = choice?.message?.content || 'Maaf, tidak ada respon dari sistem.';
      const usage = data.usage || {};

      return {
        reply,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        latencyMs,
        modelName: FIREWORKS_MODEL,
        retrievedSources: sourcesSummary,
      };
    } catch (error: any) {
      console.warn('⚠️ Fireworks Chat API error:', error?.response?.data || error?.message);
    }
  }

  // Fallback mode with conversation history context
  const lastUserMsg = conversationHistory.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
  const fallbackReply = generateFallbackResponse(lastUserMsg, retrievedChunks, visitorName, conversationHistory);
  const latencyMs = Date.now() - startTime;

  const promptToks = Math.ceil(systemPrompt.length / 4) + Math.ceil(lastUserMsg.length / 4);
  const compToks = Math.ceil(fallbackReply.length / 4);

  return {
    reply: fallbackReply,
    promptTokens: promptToks,
    completionTokens: compToks,
    totalTokens: promptToks + compToks,
    latencyMs,
    modelName: FIREWORKS_MODEL + (FIREWORKS_API_KEY ? '' : ' (Local AI)'),
    retrievedSources: sourcesSummary,
  };
}
