import { initDatabase } from '../db/init';
import { scrapeSitaPortal } from '../services/scraperService';

async function run() {
  try {
    await initDatabase();
    const result = await scrapeSitaPortal();
    console.log('✅ Scraping and Vector Embedding completed successfully:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during scraping script:', error);
    process.exit(1);
  }
}

run();
