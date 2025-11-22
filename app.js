import fetch from "node-fetch";
import * as cheerio from 'cheerio';
import chalk from 'chalk';
import { faker } from '@faker-js/faker';
import { promises as fs, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Load config
const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

// Extended proxy list with more servers/countries
const proxies = {
  france: 'http://ffff3162f4aa205c0326__cr.fr:e3f079bb220c14b6@gw.dataimpulse.com:823',
  germany: 'http://ffff3162f4aa205c0326__cr.tw:e3f079bb220c14b6@gw.dataimpulse.com:823',
  korea: 'http://ffff3162f4aa205c0326__cr.kr,de,fr:e3f079bb220c14b6@gw.dataimpulse.com:823',
  croatia: 'http://ffff3162f4aa205c0326__cr.hr:e3f079bb220c14b6@gw.dataimpulse.com:823',
  switzerland: 'http://ffff3162f4aa205c0326__cr.ch:e3f079bb220c14b6@gw.dataimpulse.com:823',
  singapore: 'http://ffff3162f4aa205c0326__cr.sg:e3f079bb220c14b6@gw.dataimpulse.com:823',
  usa: 'http://ffff3162f4aa205c0326__cr.us:e3f079bb220c14b6@gw.dataimpulse.com:823',
  canada: 'http://ffff3162f4aa205c0326__cr.ca:e3f079bb220c14b6@gw.dataimpulse.com:823',
  brazil: 'http://ffff3162f4aa205c0326__cr.br:e3f079bb220c14b6@gw.dataimpulse.com:823',
  th: 'http://ffff3162f4aa205c0326__cr.th:e3f079bb220c14b6@gw.dataimpulse.com:823',
  india: 'http://ffff3162f4aa205c0326__cr.in:e3f079bb220c14b6@gw.dataimpulse.com:823',
  japan: 'http://ffff3162f4aa205c0326__cr.jp:e3f079bb220c14b6@gw.dataimpulse.com:823',
  australia: 'http://ffff3162f4aa205c0326__cr.au:e3f079bb220c14b6@gw.dataimpulse.com:823',
  italy: 'http://ffff3162f4aa205c0326__cr.it:e3f079bb220c14b6@gw.dataimpulse.com:823',
  spain: 'http://ffff3162f4aa205c0326__cr.es:e3f079bb220c14b6@gw.dataimpulse.com:823'
};

const countryNames = {
  france: 'France',
  germany: 'Germany',
  korea: 'South Korea',
  croatia: 'Croatia',
  switzerland: 'Switzerland',
  singapore: 'Singapore',
  usa: 'USA',
  canada: 'Canada',
  brazil: 'Brazil',
  thailand: 'Thailand',
  india: 'India',
  japan: 'Japan',
  australia: 'Australia',
  italy: 'Italy',
  spain: 'Spain'
};

function fetchWithProxy(url, options = {}, proxyUrl) {
  if (proxyUrl) {
    const agent = new HttpsProxyAgent(proxyUrl);
    options.agent = agent;
  }
  return fetch(url, options);
}

function encryptToTargetHex(input) {
  let hexResult = "";
  for (const char of input) {
    const encryptedCharCode = char.charCodeAt(0) ^ 0x05;
    hexResult += encryptedCharCode.toString(16).padStart(2, "0");
  }
  return hexResult;
}

const fetchCapcutDomains = async (proxy) => {
  try {
    const response = await fetchWithProxy('https://generator.email/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      }
    }, proxy);

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const domains = new Set();

    $('.e7m.tt-suggestions p').each((_, el) => {
      const dom = $(el).text().trim();
      if (dom && dom.includes('.')) {
        domains.add(dom);
      }
    });

    return Array.from(domains);
  } catch (err) {
    console.error(chalk.red('Error scraping generator.email domains:', err.message));
    return [];
  }
};

const getEmailRandom = async (proxy) => {
  try {
    const scrapedDomains = await fetchCapcutDomains(proxy);
    if (!scrapedDomains || scrapedDomains.length === 0) {
      throw new Error('No generator.email domains found');
    }
    return scrapedDomains;
  } catch (err) {
    console.error(chalk.red('Error generating email domains:', err.message));
    return [];
  }
};

const functionGetLink = async (email, domain, proxy) => {
  try {
    const response = await fetchWithProxy(`https://generator.email/`, {
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'cookie': `surl=${domain}%2F${email}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    }, proxy);
    
    const text = await response.text();
    const $ = cheerio.load(text);
    const src = $("#email-table > div.e7m.row.list-group-item > div.e7m.col-md-12.ma1 > div.e7m.mess_bodiyy > div > div > div:nth-child(2) > p:nth-child(2) > span").text().trim();
    return src;
  } catch (err) {
    console.error(chalk.red("Error fetching verification code:", err.message));
    return null;
  }
};

async function regist_sendRequest(encryptedEmail, encryptedPassword, proxy) {
  try {
    const url = new URL('https://www.capcut.com/passport/web/email/send_code/');
    const queryParams = {
      aid: '348188',
      account_sdk_source: 'web',
      language: 'en',
      verifyFp: 'verify_m7euzwhw_PNtb4tlY_I0az_4me0_9Hrt_sEBZgW5GGPdn',
      check_region: '1'
    };

    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const formData = new URLSearchParams();
    formData.append('mix_mode', '1');
    formData.append('email', encryptedEmail);
    formData.append('password', encryptedPassword);
    formData.append('type', '34');
    formData.append('fixed_mix_mode', '1');
    
    const response = await fetchWithProxy(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.capcut.com',
        'Referer': 'https://www.capcut.com/',
        'Cache-Control': 'no-cache'
      },
      body: formData
    }, proxy);
    
    // Check if response is ok and has content
    if (!response.ok) {
      console.error(chalk.red(`HTTP Error: ${response.status} ${response.statusText}`));
      return { message: 'error', error: `HTTP ${response.status}` };
    }

    const responseText = await response.text();
    
    // Check if response is empty
    if (!responseText.trim()) {
      console.error(chalk.red('Empty response from server'));
      return { message: 'error', error: 'Empty response' };
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error(chalk.red('Failed to parse JSON response:', responseText.substring(0, 200)));
      return { message: 'error', error: 'Invalid JSON response' };
    }

  } catch (error) {
    console.error('Error in registration request:', error);
    return { message: 'error', error: error.message };
  }
}

async function verify_sendRequest(encryptedEmail, encryptedPassword, encryptedCode, proxy) {
  try {
    const originalDate = faker.date.birthdate();
    const dateObj = new Date(originalDate);
    const formattedDate = dateObj.toISOString().split('T')[0];
    const url = new URL('https://www.capcut.com/passport/web/email/register_verify_login/');
    const queryParams = {
      aid: '348188',
      account_sdk_source: 'web',
      language: 'en',
      verifyFp: 'verify_m7euzwhw_PNtb4tlY_I0az_4me0_9Hrt_sEBZgW5GGPdn',
      check_region: '1'
    };

    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const formData = new URLSearchParams();
    formData.append('mix_mode', '1');
    formData.append('email', encryptedEmail);
    formData.append('code', encryptedCode);
    formData.append('password', encryptedPassword);
    formData.append('type', '34');
    formData.append('birthday', formattedDate);
    formData.append('force_user_region', 'ID');
    formData.append('biz_param', '%7B%7D');
    formData.append('check_region', '1');
    formData.append('fixed_mix_mode', '1');
    
    const response = await fetchWithProxy(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.capcut.com',
        'Referer': 'https://www.capcut.com/',
        'Cache-Control': 'no-cache'
      },
      body: formData
    }, proxy);
    
    // Check if response is ok and has content
    if (!response.ok) {
      console.error(chalk.red(`HTTP Error: ${response.status} ${response.statusText}`));
      return { message: 'error', error: `HTTP ${response.status}` };
    }

    const responseText = await response.text();
    
    // Check if response is empty
    if (!responseText.trim()) {
      console.error(chalk.red('Empty response from server'));
      return { message: 'error', error: 'Empty response' };
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error(chalk.red('Failed to parse JSON response:', responseText.substring(0, 200)));
      return { message: 'error', error: 'Invalid JSON response' };
    }

  } catch (error) {
    console.error('Error in verification request:', error);
    return { message: 'error', error: error.message };
  }
}

async function saveToFile(filename, data) {
  try {
    await fs.writeFile(filename, data, { flag: 'a' });
  } catch (error) {
    console.error('Error saving to file:', error);
  }
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `[${hours}:${minutes}]`;
}

function displayCountryMenu() {
  console.log(chalk.yellow.bold('\n╔══════════════════════════════════╗'));
  console.log(chalk.yellow.bold('║        SELECT COUNTRY          ║'));
  console.log(chalk.yellow.bold('╠══════════════════════════════════╣'));
  console.log(chalk.cyan('║ [1] France               (fr)    ║'));
  console.log(chalk.cyan('║ [2] Germany             (de)     ║'));
  console.log(chalk.cyan('║ [3] South Korea         (kr)     ║'));
  console.log(chalk.cyan('║ [4] Croatia             (hr)     ║'));
  console.log(chalk.cyan('║ [5] Switzerland         (ch)     ║'));
  console.log(chalk.cyan('║ [6] Singapore           (sg)     ║'));
  console.log(chalk.cyan('║ [7] USA                 (us)     ║'));
  console.log(chalk.cyan('║ [8] Canada              (ca)     ║'));
  console.log(chalk.cyan('║ [9] Brazil              (br)     ║'));
  console.log(chalk.cyan('║ [10] Thailand           (th)     ║'));
  console.log(chalk.cyan('║ [11] India              (in)     ║'));
  console.log(chalk.cyan('║ [12] Japan              (jp)     ║'));
  console.log(chalk.cyan('║ [13] Australia          (au)     ║'));
  console.log(chalk.cyan('║ [14] Italy              (it)     ║'));
  console.log(chalk.cyan('║ [15] Spain              (es)     ║'));
  console.log(chalk.yellow.bold('╚══════════════════════════════════╝\n'));
}

async function promptUser() {
  return new Promise((resolve) => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    displayCountryMenu();

    readline.question('How many accounts to create? ', (count) => {
      readline.question('Enter country choice (number or code): ', (countryInput) => {
        readline.close();
        
        let country;
        const cleanInput = countryInput.trim().toLowerCase();
        
        // Map input to country code
        if (['1', 'fr', 'france'].includes(cleanInput)) {
          country = 'france';
        } else if (['2', 'de', 'germany'].includes(cleanInput)) {
          country = 'germany';
        } else if (['3', 'kr', 'korea', 'south korea'].includes(cleanInput)) {
          country = 'korea';
        } else if (['4', 'hr', 'croatia'].includes(cleanInput)) {
          country = 'croatia';
        } else if (['5', 'ch', 'switzerland'].includes(cleanInput)) {
          country = 'switzerland';
        } else if (['6', 'sg', 'singapore'].includes(cleanInput)) {
          country = 'singapore';
        } else if (['7', 'us', 'usa', 'united states'].includes(cleanInput)) {
          country = 'usa';
        } else if (['8', 'ca', 'canada'].includes(cleanInput)) {
          country = 'canada';
        } else if (['9', 'br', 'brazil'].includes(cleanInput)) {
          country = 'brazil';
        } else if (['10', 'th', 'thai', 'thailand'].includes(cleanInput)) {
          country = 'th';
        } else if (['11', 'in', 'india'].includes(cleanInput)) {
          country = 'india';
        } else if (['12', 'jp', 'japan'].includes(cleanInput)) {
          country = 'japan';
        } else if (['13', 'au', 'australia'].includes(cleanInput)) {
          country = 'australia';
        } else if (['14', 'it', 'italy'].includes(cleanInput)) {
          country = 'italy';
        } else if (['15', 'es', 'spain'].includes(cleanInput)) {
          country = 'spain';
        } else {
          console.log(chalk.red(`Invalid country choice "${countryInput}". Defaulting to France.`));
          country = 'france';
        }
        
        resolve({ count, country });
      });
    });
  });
}

(async () => {
  try {
    const { count, country } = await promptUser();

    let loopCount = parseInt(count);
    if (isNaN(loopCount) || loopCount <= 0) {
      console.log(chalk.red(`Invalid number of accounts "${count}". Defaulting to 1.`));
      loopCount = 1;
    }

    const selectedProxy = proxies[country];
    const countryName = countryNames[country];

    console.log(chalk.green.bold(`\n${getCurrentTime()} Starting with ${countryName} proxy`));
    console.log(chalk.green(`${getCurrentTime()} Creating ${loopCount} account(s)`));
    const availableDomains = await getEmailRandom(selectedProxy);
    if (!availableDomains || availableDomains.length === 0) {
      console.log(chalk.red(`${getCurrentTime()} No domains available for signup.`));
      return;
    }

    console.log(chalk.magenta(`${getCurrentTime()} Using domains: ${availableDomains.join(', ')}\n`));

    const promises = [];

    for (let i = 1; i <= loopCount; i++) {
      promises.push((async () => {
        try {
          console.log(chalk.cyan.bold(`${getCurrentTime()} [Account ${i}/${loopCount}]`));
          console.log(chalk.blue(`${getCurrentTime()} Generating random email...`));

          const domain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
          const name = faker.internet.username().toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
          const email = `${name}@${domain}`;
          console.log(chalk.green.bold(`${getCurrentTime()} Email:`), chalk.white(email));
          
          const password = config.password;
          const encryptedHexEmail = encryptToTargetHex(email);
          const encryptedHexPassword = encryptToTargetHex(password);

          console.log(chalk.blue(`${getCurrentTime()} Sending registration request...`));
          const reqnya = await regist_sendRequest(encryptedHexEmail, encryptedHexPassword, selectedProxy);

          if (reqnya && reqnya.message === "success") {
            console.log(chalk.blue(`${getCurrentTime()} Waiting for verification email...`));

            let verificationCode;
            let attempts = 0;
            const maxAttempts = 12;
            
            do {
              verificationCode = await functionGetLink(email.split('@')[0], email.split('@')[1], selectedProxy);
              if (!verificationCode) {
                attempts++;
                console.log(chalk.yellow(`${getCurrentTime()} Attempt ${attempts}/${maxAttempts} - No code yet, waiting...`));
                await new Promise(resolve => setTimeout(resolve, 6000));
              }
            } while (!verificationCode && attempts < maxAttempts);

            if (!verificationCode) {
              console.log(chalk.red(`${getCurrentTime()} Failed to get verification code after ${maxAttempts} attempts`));
              return;
            }

            console.log(chalk.green(`${getCurrentTime()} Verification code received: ${verificationCode}`));

            // Verify the account
            console.log(chalk.blue(`${getCurrentTime()} Verifying account...`));
            const verifyResult = await verify_sendRequest(encryptedHexEmail, encryptedHexPassword, encryptToTargetHex(verificationCode), selectedProxy);
            
            if (verifyResult && verifyResult.message === "success") {
              // Only save email:password, as per your request
              const walletData = `${email}:${password}\n`;
              await saveToFile(`accounts.txt`, walletData);
              console.log(chalk.green.bold(`${getCurrentTime()} ✅ Account created successfully!`));
              console.log(chalk.green(`╔══════════════════════════════════╗`));
              console.log(chalk.green(`║ Email:    ${email.padEnd(25)} ║`));
              console.log(chalk.green(`║ Password: ${password.padEnd(25)} ║`));
              console.log(chalk.green(`╚══════════════════════════════════╝\n`));
            } else {
              console.log(chalk.red(`${getCurrentTime()} ❌ Verification failed`));
              if (verifyResult && verifyResult.error) {
                console.log(chalk.red(`${getCurrentTime()} Error: ${verifyResult.error}`));
              }
            }
          } else {
            console.log(chalk.red(`${getCurrentTime()} ❌ Registration failed for ${domain}`));
            if (reqnya && reqnya.error) {
              console.log(chalk.red(`${getCurrentTime()} Error: ${reqnya.error}`));
            }
          }
        } catch (error) {
          console.log(chalk.red(`${getCurrentTime()} ❌ Error in iteration ${i}:`), error.message);
        }
      })());
    }

    await Promise.all(promises);
    console.log(chalk.green.bold(`\n${getCurrentTime()} 🎉 All operations completed!`));
    console.log(chalk.cyan(`${getCurrentTime()} Check accounts.txt for successful registrations.`));
  } catch (error) {
    console.log(chalk.red(`${getCurrentTime()} Fatal error:`), error.message);
  }
})();