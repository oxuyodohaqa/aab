import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import chalk from 'chalk';

const allowedGeneratorSuffixes = ['web.id', 'biz.id', 'my.id'];

async function fetchGeneratorDomains() {
  try {
    const response = await fetch('https://generator.email/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      }
    });

    if (!response.ok) {
      console.error(chalk.red(`Failed to fetch generator.email: HTTP ${response.status}`));
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const domains = new Set();

    $('.e7m.tt-suggestions p').each((_, el) => {
      const dom = $(el).text().trim();
      if (dom && dom.includes('.')) {
        const matchesSuffix = allowedGeneratorSuffixes.some((suffix) => dom.endsWith(suffix));
        if (matchesSuffix) {
          domains.add(dom);
        }
      }
    });

    return Array.from(domains).sort();
  } catch (err) {
    console.error(chalk.red('Error scraping generator.email domains:', err.message));
    return [];
  }
}

(async () => {
  const filteredDomains = await fetchGeneratorDomains();

  if (filteredDomains.length === 0) {
    console.log(chalk.yellow('No generator.email domains matched .web.id, .biz.id, or .my.id.'));
    return;
  }

  console.log(chalk.green(`Found ${filteredDomains.length} generator.email domain(s) matching .id suffixes:`));
  filteredDomains.forEach((domain, index) => {
    console.log(chalk.cyan(`${index + 1}. ${domain}`));
  });
})();
