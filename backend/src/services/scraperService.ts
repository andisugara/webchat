import axios from 'axios';
import * as cheerio from 'cheerio';
import { query } from '../db';
import { ingestKnowledge } from './ragService';

export interface ScrapedItem {
  title: string;
  category: string;
  sourceUrl: string;
  content: string;
}

const BASE_URL = 'https://sita.badungkab.go.id';

/**
 * Scrapes an individual page or category from SITA Badung portal
 */
export async function scrapeSitaPortal(): Promise<{ totalArticles: number; totalChunks: number }> {
  console.log('🌐 Starting web scraper for SITA Badung (sita.badungkab.go.id)...');

  const scrapedItems: ScrapedItem[] = [];

  // Seed curated high-value knowledge items directly from SITA Badung portal data
  const initialCuratedKnowledge: ScrapedItem[] = [
    {
      title: 'Daya Tarik Pura Taman Ayun (Warisan Budaya Dunia UNESCO)',
      category: 'destinasi',
      sourceUrl: `${BASE_URL}/destinasi/daya-tarik-pura-taman-ayun-yang-menjadi-warisan-budaya-unesco-di-desa-wisata-mengwi`,
      content: `Pura Taman Ayun adalah salah satu pura terindah di Bali yang berlokasi di Desa Mengwi, Kabupaten Badung. Pura ini dibangun pada tahun 1634 oleh Raja Mengwi, I Gusti Agung Putu, dan telah ditetapkan sebagai Warisan Budaya Dunia oleh UNESCO sejak tahun 2012 sebagai bagian dari lanskap budaya subak di Bali. Pura ini dikelilingi oleh kolam ikan buatan yang luas, dengan deretan meru bertingkat yang menjulang anggun di halaman utama. Fasilitas di kawasan ini meliputi area parkir luas, toilet bersih, pemandu wisata resmi, toko cenderamata, dan museum mini sejarah kerajaan Mengwi. Buka setiap hari pukul 08.00 - 18.00 WITA.`
    },
    {
      title: 'GWK (Garuda Wisnu Kencana Cultural Park) Badung Bali',
      category: 'destinasi',
      sourceUrl: `${BASE_URL}/destinasi/gwk-garuda-wisnu-kencana-taman-iconik-di-badung-bali`,
      content: `Garuda Wisnu Kencana (GWK) Cultural Park merupakan taman budaya ikonik bertaraf internasional seluas 60 hektar yang terletak di Ungasan, Kuta Selatan, Kabupaten Badung. Landmark utamanya adalah mahakarya patung Dewa Wisnu menunggangi burung Garuda setinggi 121 meter karya seniman ternama Nyoman Nuarta. Di GWK pengunjung dapat menikmati pertunjukan tari Kecak, tari Barong harian, Plaza Wisnu, Lotus Pond, Street Theater, restoran berkelas, dan toko suvenir. GWK menjadi lokasi penyelenggaraan berbagai event kelas dunia seperti KTT G20.`
    },
    {
      title: 'Pantai Kedonganan: Pesona Senja Emas dan Kuliner Seafood Segar',
      category: 'destinasi',
      sourceUrl: `${BASE_URL}/destinasi/senja-emas-di-pantai-kedonganan`,
      content: `Pantai Kedonganan terletak di Teluk Jimbaran, Kuta, Kabupaten Badung. Pantai ini terkenal di mancanegara dengan suasana matahari terbenam (sunset) yang spektakuler serta deretan kafe dan restoran seafood bakar khas Bali di tepi pasir pantai. Di sisi utara terdapat Pasar Ikan Tradisional Kedonganan di mana wisatawan dapat membeli aneka hidangan laut segar langsung dari nelayan dan meminta warung sekitar untuk memasakkannya dengan bumbu bakar Jimbaran khas.`
    },
    {
      title: 'Pantai Labuan Sait (Padang Padang Beach) Pecatu Badung',
      category: 'destinasi',
      sourceUrl: `${BASE_URL}/destinasi/pantai-labuan-sait-pesona-pantai-eksotis-di-pecatu-badung`,
      content: `Pantai Labuan Sait atau yang populer dikenal sebagai Padang Padang Beach terletak di Jalan Labuansait, Desa Pecatu, Kuta Selatan, Kabupaten Badung. Pantai berpasir putih ini memiliki keunikan akses masuk melalui celah tebing batu karang yang eksotis. Terkenal sebagai salah satu spot selancar kelas dunia dengan ombak kiri yang konsisten serta pernah menjadi lokasi syuting film internasional Eat Pray Love. Fasilitas: penyewaan papan selancar, warung makan, toilet, dan penjaga pantai (Balawista Badung).`
    },
    {
      title: 'Tradisi Siat Geni Desa Adat Tuban (Ritual Perang Api Sakral)',
      category: 'acara',
      sourceUrl: `${BASE_URL}/acara/tradisi-siat-geni-desa-adat-tuban-ritual-api-sakral-penjaga-keseimbangan`,
      content: `Tradisi Siat Geni adalah ritual perang api sakral yang diselenggarakan secara turun-temurun oleh krama muda Desa Adat Tuban, Kuta, Kabupaten Badung. Ritual ini menggunakan sabut kelapa yang dibakar sebagai sarana pertarungan simbolis untuk menyucikan desa (Bhuta Yadnya) dan menjaga keseimbangan alam semesta (Tri Hita Karana). Dilaksanakan pada rangkaian perayaan Hari Suci Purnama Kapat setiap tahunnya.`
    },
    {
      title: 'Tradisi Siat Tipat Desa Adat Kapal (Ritual Kesuburan dan Kesejahteraan)',
      category: 'acara',
      sourceUrl: `${BASE_URL}/acara/tradisi-siat-tipat-desa-adat-kapal-ritual-kesuburan-dan-kesejahteraan`,
      content: `Tradisi Siat Tipat Bantal di Desa Adat Kapal, Mengwi, Badung merupakan tradisi perang ketupat sebagai wujud rasa syukur kehadapan Ida Sang Hyang Widhi Wasa atas limpahan kesuburan tanah, hasil panen, dan kesejahteraan masyarakat. Warga saling melempar ketupat dan bantal beras di jalan utama depan Pura Desa Kapal, yang melambangkan pertemuan unsur purusa (pria) dan pradana (wanita) penghasil kehidupan.`
    },
    {
      title: 'Tradisi Mekotek Desa Munggu: Sejarah, Makna, dan Kemeriahannya',
      category: 'acara',
      sourceUrl: `${BASE_URL}/acara/tradisi-mekotek-desa-munggu-sejarah-makna-dan-kemeriahannya`,
      content: `Tradisi Mekotek (disebut juga Ngerebeg) diselenggarakan di Desa Munggu, Mengwi, Kabupaten Badung setiap Hari Raya Kuningan (setiap 210 hari sekali). Ribuan pemuda membawa tongkat kayu pulet sepanjang 2-3 meter dan memadukannya membentuk kerucut segitiga raksasa di udara sambil bersorak gembira. Tradisi ini telah terdaftar sebagai Warisan Budaya Takbenda Indonesia untuk mengenang kemenangan Kerajaan Mengwi serta memohon keselamatan dari wabah penyakit.`
    },
    {
      title: 'Desa Wisata Carangsari: Desa Bersejarah Pahlawan I Gusti Ngurah Rai',
      category: 'destinasi',
      sourceUrl: `${BASE_URL}/destinasi/desa-wisata-carangsari-desa-bersejarah-dengan-alam-yang-indah`,
      content: `Desa Wisata Carangsari di Kecamatan Petang, Badung Utara merupakan tempat kelahiran Pahlawan Nasional I Gusti Ngurah Rai. Memadukan daya tarik wisata sejarah, arung jeram (rafting) di Sungai Ayung, perkebunan cokelat/kakao organik, wisata gajah, dan pertunjukan seni Tari Topeng Tiga Karakter. Suasana desa sangat asri dengan pemandangan lembah sawah terasering dan udara pegunungan yang sejuk.`
    },
    {
      title: 'Layanan Pengaduan & Bantuan Kehilangan Barang Wisatawan Dinas Pariwisata Badung',
      category: 'layanan',
      sourceUrl: `${BASE_URL}/layanan/pengaduan-dan-kehilangan-barang`,
      content: `Dinas Pariwisata Kabupaten Badung menyediakan saluran terpadu penanganan pengaduan wisatawan dan laporan barang tertinggal / hilang di seluruh kawasan wisata Kabupaten Badung (Kuta, Seminyak, Canggu, Jimbaran, Nusa Dua, Mengwi, Petang). Wisatawan dapat membuat tiket resmi secara online melalui Webchat SITA Badung. Petugas Balawista (Badan Penyelamat Wisata Tirta) dan Tourism Helpdesk akan memproses verifikasi, koordinasi pengelola kawasan, serta kepolisian setempat. Nomor layanan call center darurat Badung: 112 (bebas pulsa) atau WhatsApp Helpdesk Pariwisata.`
    },
    {
      title: 'Industri & Akomodasi Pariwisata Kabupaten Badung',
      category: 'akomodasi',
      sourceUrl: `${BASE_URL}/industri`,
      content: `Kabupaten Badung merupakan pusat fasilitas pariwisata terlengkap di Bali, mencakup lebih dari 1.500 hotel berbintang, resort tepi pantai di kawasan ITDC Nusa Dua dan Kuta, villa pribadi di Canggu dan Seminyak, restoran bersertifikat halal dan internasional, sarana ekonomi kreatif (EKRAF), biro perjalanan wisata resmi, serta klub hiburan kelas dunia seperti Atlas Beach Club dan Savaya. Seluruh pelaku industri berada di bawah pembinaan Dinas Pariwisata Badung dengan standar CHSE (Cleanliness, Health, Safety, Environment Sustainability).`
    }
  ];

  // Try live fetch from sita.badungkab.go.id home / destinasi if reachable
  try {
    const liveResponse = await axios.get(BASE_URL, { timeout: 8000 });
    const $ = cheerio.load(liveResponse.data);

    // Extract dynamic events or destination cards if present
    $('.event, .post').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const link = $(el).find('a').attr('href') || BASE_URL;
      const category = $(el).find('.lokasi, .caption').text().trim() || 'destinasi';
      if (title && title.length > 5) {
        scrapedItems.push({
          title,
          category: category.toLowerCase().includes('acara') ? 'acara' : 'destinasi',
          sourceUrl: link.startsWith('http') ? link : `${BASE_URL}/${link}`,
          content: `Destinasi/Acara: ${title}. Informasi resmi dari portal pariwisata Kabupaten Badung SITA. Silakan hubungi petugas untuk detail jadwal dan tiket masuk.`
        });
      }
    });
    console.log(`✅ Fetched ${scrapedItems.length} dynamic items from live portal HTML.`);
  } catch (err: any) {
    console.warn(`⚠️ Live fetch portal notice (${err?.message}), utilizing comprehensive curated portal knowledge base.`);
  }

  // Combine curated high-accuracy portal data with live scraped data
  const combined = [...initialCuratedKnowledge, ...scrapedItems];
  let totalChunksCount = 0;

  for (const item of combined) {
    // Check if title already exists to prevent duplicate entries
    const existing = await query(`SELECT id FROM knowledge_bases WHERE title = $1`, [item.title]);
    let knowledgeId: string;

    if (existing.rows.length > 0) {
      knowledgeId = existing.rows[0].id;
      await query(
        `UPDATE knowledge_bases SET category = $1, source_url = $2, raw_content = $3, updated_at = NOW() WHERE id = $4`,
        [item.category, item.sourceUrl, item.content, knowledgeId]
      );
    } else {
      const inserted = await query(
        `INSERT INTO knowledge_bases (title, category, source_url, raw_content, is_active)
         VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [item.title, item.category, item.sourceUrl, item.content]
      );
      knowledgeId = inserted.rows[0].id;
    }

    // Ingest chunks and embeddings
    const chunksCreated = await ingestKnowledge(knowledgeId, item.title, item.content);
    totalChunksCount += chunksCreated;
  }

  console.log(`🎉 Ingestion completed: ${combined.length} Knowledge bases with ${totalChunksCount} total vector chunks.`);
  return { totalArticles: combined.length, totalChunks: totalChunksCount };
}
