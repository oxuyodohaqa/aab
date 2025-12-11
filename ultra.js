const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('./config.json');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const fastDelay = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));
const { faker } = require('@faker-js/faker');

puppeteer.use(StealthPlugin());

function getRandomUserAgent() {
    return faker.internet.userAgent();
}

// Generate short emails with faker names and 3-digit numbers (1-999)
function generateEmail() {
    const firstName = faker.person.firstName().toLowerCase();
    const randomNum = Math.floor(Math.random() * 999) + 1; // 1-999
    
    return `${firstName}${randomNum}@${config.domain}`;
}

// CAPTCHA DELAY - Only for Buster operations
const captchaDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let totalSuccessful = 0;
let totalAttempts = 0;

// Links management
let availableLinks = [];
let usedLinks = [];
let assignedLinks = new Map(); // browserId -> link

// User preferences
let userBrowserCount = 5;
let userAccountTarget = 10;
let userMode = 1; // 1 = signup only, 2 = signup + verify

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promise wrapper for readline
const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
};

// Load and manage links
async function loadLinks() {
    try {
        const linksFile = 'links.txt';
        if (!fsSync.existsSync(linksFile)) {
            console.log("❌ links.txt file not found. Creating empty file...");
            await fs.writeFile(linksFile, '');
            return [];
        }
        
        const content = await fs.readFile(linksFile, 'utf8');
        const links = content.split('\n').filter(link => link.trim() !== '');
        
        console.log(`📋 Total links found: ${links.length}`);
        console.log(`🔗 Available verification links: ${links.length}`);
        
        // Show first few links as preview
        if (links.length > 0) {
            console.log(`📝 Preview of links:`);
            links.slice(0, 3).forEach((link, index) => {
                console.log(`   ${index + 1}. ${link.substring(0, 80)}...`);
            });
            if (links.length > 3) {
                console.log(`   ... and ${links.length - 3} more links`);
            }
        }
        
        return links;
    } catch (error) {
        console.log(`⚠️ Error loading links: ${error.message}`);
        return [];
    }
}

// Get next link and IMMEDIATELY remove from pool
function getNextLink() {
    if (availableLinks.length === 0) {
        return null;
    }
    
    // Get and IMMEDIATELY remove the link from pool
    const link = availableLinks.shift(); // Remove from start of array
    
    console.log(`🔗 Assigned link: ${link.substring(0, 60)}...`);
    console.log(`📊 Links remaining in pool: ${availableLinks.length}`);
    
    return link;
}

// Track which browser is using which link
function assignLinkToBrowser(browserId, link) {
    assignedLinks.set(browserId, link);
    console.log(`[B-${browserId}] 🔗 Link assigned to this browser`);
}

// Mark link as successfully used (verification succeeded)
function markLinkAsUsed(browserId, link) {
    // Remove from assigned tracking
    assignedLinks.delete(browserId);
    
    // Add to used links (permanently removed)
    usedLinks.push(link);
    console.log(`[B-${browserId}] ✅ Link marked as USED (verification succeeded)`);
    console.log(`📊 Links remaining in pool: ${availableLinks.length}`);
    console.log(`🔄 Total links used successfully: ${usedLinks.length}`);
}

// Return link to pool if verification failed
function returnLinkToPool(browserId, link) {
    // Remove from assigned tracking
    assignedLinks.delete(browserId);
    
    // Return to FRONT of available links for immediate retry
    availableLinks.unshift(link);
    console.log(`[B-${browserId}] 🔄 Link RETURNED to pool (verification failed)`);
    console.log(`📊 Links now available: ${availableLinks.length}`);
}

// Update links file (save only remaining + returned links)
async function updateLinksFile() {
    try {
        // Write back only the remaining links (excludes successfully used ones)
        const remainingLinks = availableLinks.join('\n');
        await fs.writeFile('links.txt', remainingLinks);
        console.log(`💾 Updated links.txt`);
        console.log(`   ✅ Successfully used: ${usedLinks.length}`);
        console.log(`   📋 Remaining in pool: ${availableLinks.length}`);
        console.log(`   🔄 Currently assigned: ${assignedLinks.size}`);
    } catch (error) {
        console.log(`⚠️ Error updating links file: ${error.message}`);
    }
}

async function pageHasAutomatedQueryBlock(page) {
    try {
        const frames = page.frames();

        for (const frame of frames) {
            try {
                const text = await frame.evaluate(() => document.body.textContent.toLowerCase());
                if (
                    text.includes('your computer or network may be sending automated queries') ||
                    text.includes('try again later')
                ) {
                    return true;
                }
            } catch (error) {
                continue;
            }
        }

        return false;
    } catch (error) {
        return false;
    }
}

async function assertNotAutomationBlocked(page, browserId, context) {
    const automationBlocked = await pageHasAutomatedQueryBlock(page);
    if (automationBlocked) {
        console.log(`[B-${browserId}] ⛔ Automated query block detected during ${context} - restarting browser`);
        throw new Error('Automated query block page');
    }
}

async function saveUnverifiedAccount(browserId, email, password, page, reason) {
    if (page) {
        const automationBlocked = await pageHasAutomatedQueryBlock(page);
        if (automationBlocked) {
            console.log(`[B-${browserId}] ⏩ Skipping unverified save (automated query block detected)`);
            return;
        }
    }

    const unverifiedData = `${email}:${password}\n`;
    await fs.appendFile('unverified.txt', unverifiedData);
    console.log(`[B-${browserId}] 💾 Account saved to unverified.txt (${reason})`);
}

// Calculate window position
function getWindowPosition(browserId) {
    const windowWidth = 320;
    const windowHeight = 520;
    const margin = 10;
    const rowSpacing = windowHeight + 40;
    const browsersPerRow = Math.floor(1920 / (windowWidth + margin));

    const row = Math.floor((browserId - 1) / browsersPerRow);
    const col = (browserId - 1) % browsersPerRow;

    return {
        x: col * (windowWidth + margin),
        y: row * rowSpacing
    };
}

// COMPLETE COOKIE BLOCKER
async function blockAllCookies(page, browserId) {
    try {
        console.log(`[B-${browserId}] 🚫 BLOCKING ALL COOKIES...`);
        
        await page.setRequestInterception(true);
        
        page.on('request', (request) => {
            const url = request.url();
            const resourceType = request.resourceType();
            
            if (url.includes('cookie') || 
                url.includes('consent') || 
                url.includes('gdpr') || 
                url.includes('onetrust') || 
                resourceType === 'font' ||
                resourceType === 'image') {
                request.abort();
                return;
            }
            
            request.continue();
        });
        
        await page.addStyleTag({
            content: `
                [class*="cookie" i],
                [id*="cookie" i],
                [class*="consent" i],
                [class*="gdpr" i],
                .cookie-banner,
                .consent-banner,
                .privacy-banner {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
            `
        });
        
        console.log(`[B-${browserId}] ✅ ALL COOKIES BLOCKED`);
        return true;
        
    } catch (error) {
        console.log(`[B-${browserId}] ⚠️ Cookie blocking error: ${error.message}`);
        return false;
    }
}

// Smart Continue button clicker - works even with captcha present
async function smartClickContinue(page, browserId, attempts = 6) {
    try {
        console.log(`[B-${browserId}] 🎯 Smart Continue click...`);

        await fastDelay(500);

        for (let attempt = 1; attempt <= attempts; attempt++) {
            // Try to click continue even if captcha is visible
            const clicked = await page.evaluate(() => {
                const allButtons = Array.from(document.querySelectorAll(
                    'button, input[type="submit"], input[type="button"], a, [role="button"]'
                ));

                const terms = [
    'continue', 'submit', 'next', 'proceed', 
    'confirm', 'bevestigen', 'potvrdit', 'confirmar',
    'weiter', 'continuer', 'continuar', 'fortsetzen',
    'continuă', 'dalej', 'devam', '続行', '继续'
];
                for (const term of terms) {
                    for (const btn of allButtons) {
                        const text = (btn.textContent || btn.value || btn.innerText || '').toLowerCase().trim();

                        if (text === term || text.includes(term)) {
                            const rect = btn.getBoundingClientRect();
                            const style = window.getComputedStyle(btn);

                            // Check if visible (don't check disabled - captcha might disable it)
                            if (rect.width > 0 &&
                                rect.height > 0 &&
                                style.display !== 'none' &&
                                style.visibility !== 'hidden') {

                                try {
                                    btn.click();
                                    return true;
                                } catch (e) {
                                    try {
                                        btn.dispatchEvent(new MouseEvent('click', {
                                            view: window,
                                            bubbles: true,
                                            cancelable: true
                                        }));
                                        return true;
                                    } catch (e2) {
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                }

                return false;
            });

            if (clicked) {
                console.log(`[B-${browserId}] ✅ Continue clicked (attempt ${attempt}/${attempts})!`);
                return true;
            }

            if (attempt < attempts) {
                console.log(`[B-${browserId}] ⏳ Continue not ready (attempt ${attempt}/${attempts}), retrying...`);
                await fastDelay(500);
            }
        }

        console.log(`[B-${browserId}] ⚠️ Continue button not found after ${attempts} attempts`);
        return false;

    } catch (error) {
        console.log(`[B-${browserId}] ⚠️ Continue error: ${error.message}`);
        return false;
    }
}

// ENHANCED BUSTER CAPTCHA SOLVER
async function solveCaptchaWithBuster(page, browserId, attempt) {
    try {
        console.log(`[B-${browserId}] 🎯 Buster solving - attempt ${attempt + 1}/5`);
        
        let captchaFrame;
        try {
            await page.waitForSelector("iframe", { timeout: 8000 });
            captchaFrame = await page.$("iframe[src*='recaptcha']");
            if (!captchaFrame) {
                captchaFrame = await page.$("iframe");
            }
        } catch (e) {
            console.log(`[B-${browserId}] ⚠️ No captcha iframe`);
            await smartClickContinue(page, browserId, 10);
            return false;
        }

        if (!captchaFrame) return false;
        
        const frame = await captchaFrame.contentFrame();
        if (!frame) return false;
        
        try {
            await frame.waitForSelector(".recaptcha-checkbox-border", { timeout: 6000 });
            await frame.click(".recaptcha-checkbox-border");
            console.log(`[B-${browserId}] ✅ Checkbox clicked`);
            
            await captchaDelay(1200);
            
            try {
                await frame.waitForSelector(".recaptcha-checkbox-checked", { timeout: 2000 });
                console.log(`[B-${browserId}] ✅ Immediate solve!`);
                
                await fastDelay(800);
                await smartClickContinue(page, browserId);
                
                return true;
                
            } catch (e) {
                console.log(`[B-${browserId}] 🧩 Challenge required`);
            }
        } catch (e) {
            console.log(`[B-${browserId}] ⚠️ Checkbox click failed`);
            await smartClickContinue(page, browserId, 10);
        }
        
        let challengeFrame;
        try {
            challengeFrame = await page.waitForSelector(
                'iframe[title*="recaptcha challenge"], iframe[src*="recaptcha/api2/bframe"]',
                { timeout: 6000, visible: true }
            );
        } catch (e) {
            console.log(`[B-${browserId}] ⚠️ No challenge frame`);
            await smartClickContinue(page, browserId, 10);
            return false;
        }
        
        if (!challengeFrame) return false;
        
        const challengeFrameContent = await challengeFrame.contentFrame();
        if (!challengeFrameContent) return false;
        
        for (let busterAttempt = 1; busterAttempt <= 3; busterAttempt++) {
            try {
                console.log(`[B-${browserId}] 🎯 Buster attempt ${busterAttempt}/3`);
                
                const helpButton = await challengeFrameContent.$(".button-holder.help-button-holder, .help-button-holder");
                if (helpButton) {
                    await helpButton.click();
                    console.log(`[B-${browserId}] 🔧 Buster clicked`);
                    
                    await captchaDelay(2500);
                    
                    const mainCaptchaFrame = await page.$("iframe[src*='recaptcha']");
                    if (mainCaptchaFrame) {
                        const mainFrame = await mainCaptchaFrame.contentFrame();
                        if (mainFrame) {
                            try {
                                await mainFrame.waitForSelector(".recaptcha-checkbox-checked", { timeout: 3000 });
                                console.log(`[B-${browserId}] ✅ Buster solved!`);
                                
                                await fastDelay(800);
                                await smartClickContinue(page, browserId);
                                
                                return true;
                                
                            } catch (e) {
                                console.log(`[B-${browserId}] ⏳ Attempt ${busterAttempt} failed`);
                            }
                        }
                    }
                }
                
                if (busterAttempt < 3) {
                    try {
                        const reloadButton = await challengeFrameContent.$(".rc-button-reload");
                        if (reloadButton) {
                            await reloadButton.click();
                            await captchaDelay(1000);
                        }
                    } catch (e) {}
                }
                
            } catch (error) {
                console.log(`[B-${browserId}] ⚠️ Buster error: ${error.message}`);
            }
        }

        // Extra continue push after challenge attempts
        await smartClickContinue(page, browserId, 10);

        return false;
    } catch (error) {
        console.log(`[B-${browserId}] ⚠️ Solving error: ${error.message}`);
        return false;
    }
}

// ENHANCED CAPTCHA HANDLER WITH MULTIPLE CONTINUE ATTEMPTS
async function handleCaptchaWithBuster(page, browserId, maxRetries = 5) {
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            await assertNotAutomationBlocked(page, browserId, 'captcha handling');
            console.log(`[B-${browserId}] 🤖 Captcha attempt ${retryCount + 1}/${maxRetries}`);

            // Check if captcha is still present
            const captchaPresent = await page.evaluate(() => {
                return document.querySelector('iframe[src*="recaptcha"]') !== null;
            });
            
            if (!captchaPresent) {
                console.log(`[B-${browserId}] ✅ No captcha detected`);
                
                // Try to click continue anyway
                await smartClickContinue(page, browserId);
                
                return true;
            }
            
            const captchaSolved = await solveCaptchaWithBuster(page, browserId, retryCount);

            if (captchaSolved) {
                console.log(`[B-${browserId}] ✅ Captcha solved!`);

                // Wait and check if moved past captcha
                await fastDelay(1500);
                
                const stillOnCaptcha = await page.evaluate(() => {
                    return document.querySelector('iframe[src*="recaptcha"]') !== null;
                });
                
                if (!stillOnCaptcha) {
                    console.log(`[B-${browserId}] ✅ Successfully moved past captcha!`);
                    return true;
                } else {
                    console.log(`[B-${browserId}] ⚠️ Still on captcha, clicking continue again...`);
                    await smartClickContinue(page, browserId);
                    await fastDelay(800);
                }
            }

            await assertNotAutomationBlocked(page, browserId, 'captcha handling');

            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`[B-${browserId}] ⏳ Retry ${retryCount + 1} in 1.5 seconds...`);
                await captchaDelay(1500);
            }
            
        } catch (error) {
            console.log(`[B-${browserId}] ⚠️ Attempt ${retryCount + 1} error: ${error.message}`);
            retryCount++;
            await fastDelay(2000);
        }
    }
    
    // Final attempt to click continue even if captcha not solved
    console.log(`[B-${browserId}] 🔄 Final continue attempt...`);
    await smartClickContinue(page, browserId);
    
    return false;
}

// ✅ STRICT STUDENT VERIFICATION - ONLY RETURNS TRUE ON ACTUAL SUCCESS
async function verifyStudentAccount(page, browserId, verificationUrl, email, password) {
    try {
        console.log(`[B-${browserId}] 🎓 Starting student verification process...`);
        console.log(`[B-${browserId}] 🔗 Verification URL: ${verificationUrl.substring(0, 60)}...`);
        
        await page.goto(verificationUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        await assertNotAutomationBlocked(page, browserId, 'verification page load');

        await fastDelay(5000);
        
const isConfirmationPage = await page.evaluate(() => {
    const url = window.location.href;
    const pageText = document.body.textContent.toLowerCase();
    
    // Multi-language confirmation page detection
    const confirmationIndicators = [
        'confirm your account', 'confirm', 'verification', 'bevestigen',
        'student discount', 'verify', 'potvrdit', 'confirmer', 'bestätigen',
        '确认', 'bevestig', 'confirma', 'confirmar', 'onayla', '確認'
    ];
    
    return (url.includes('student') && url.includes('apply')) ||
           confirmationIndicators.some(indicator => pageText.includes(indicator));
});
        
        if (!isConfirmationPage) {
            console.log(`[B-${browserId}] ❌ NOT a confirmation page - verification FAILED`);
            
            await saveUnverifiedAccount(browserId, email, password, page, 'wrong page');

            return false; // ❌ FAIL - not confirmation page
        }
        
        console.log(`[B-${browserId}] ✅ Student confirmation page detected!`);
        
        let confirmClicked = false;
        
        try {
            console.log(`[B-${browserId}] 🎯 Looking for Confirm button...`);
            
            confirmClicked = await page.evaluate(() => {
                const spotifySelectors = [
                    '.ButtonInner-sc-14ud5tc-0',
                    '.encore-bright-accent-set',
                    'span[class*="ButtonInner"]',
                    'button'
                ];
                
                for (const selector of spotifySelectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = (element.textContent || element.innerText || '').trim().toLowerCase();
                        // Multi-language confirmation button texts
const confirmTexts = [
    'confirm', 'bevestigen', 'potvrdit', 'confirmer', 'bestätigen',
    '确认', 'bevestig', 'confirma', 'confirmar', 'onayla', '確認'
];

if (confirmTexts.some(confirmText => text === confirmText || text.includes(confirmText))) {
                            const style = window.getComputedStyle(element);
                            const rect = element.getBoundingClientRect();
                            
                            if (rect.width > 0 && rect.height > 0 && style.display !== 'none') {
                                try {
                                    const parentButton = element.closest('button');
                                    if (parentButton) {
                                        parentButton.click();
                                    } else {
                                        element.click();
                                    }
                                    return true;
                                } catch (e) {
                                    continue;
                                }
                            }
                        }
                    }
                }
                
                return false;
            });
            
            if (confirmClicked) {
                console.log(`[B-${browserId}] ✅ Confirm button clicked!`);
            } else {
                console.log(`[B-${browserId}] ❌ Confirm button NOT found`);
            }
        } catch (e) {
            console.log(`[B-${browserId}] ❌ Click failed: ${e.message}`);
            confirmClicked = false;
        }
        
        if (!confirmClicked) {
            console.log(`[B-${browserId}] ❌ Button click FAILED - verification FAILED`);
            
            await saveUnverifiedAccount(browserId, email, password, page, 'button not clicked');

            return false; // ❌ FAIL - button not clicked
        }
        
        // Wait for verification to complete
        console.log(`[B-${browserId}] ⏳ Waiting for verification message...`);
        
        try {
await page.waitForFunction(() => {
    const pageText = document.body.textContent.toLowerCase();
    const url = window.location.href;
    
    // Multi-language success indicators
    const successIndicators = [
        'verified', 'you\'re verified', 'student status is verified',
        'verification successful', 'verification complete', 'confirmed',
        'success', 'complete', 'discount activated', 'student discount confirmed',
        'congratulations', 'úspěch', 'successo', 'éxito', 'erfolg', '成功'
    ];
    
    return successIndicators.some(indicator => pageText.includes(indicator)) ||
           url.includes('success') || url.includes('complete') || 
           url.includes('verified') || url.includes('successo') ||
           url.includes('úspěch') || url.includes('éxito');
}, { timeout: 45000 });
            
            console.log(`[B-${browserId}] ✅ VERIFICATION MESSAGE DETECTED!`);
            console.log(`[B-${browserId}] 🎉 STUDENT VERIFICATION COMPLETED!`);
            
            // Save to verified file
            const accountData = `${email}:${password}\n`;
            await fs.appendFile('verifiedstudent.txt', accountData);
            console.log(`[B-${browserId}] 💾 Account saved to verifiedstudent.txt!`);
            
            await fastDelay(3000);
            
            return true; // ✅ SUCCESS - Actually verified!
            
        } catch (timeoutError) {
            console.log(`[B-${browserId}] ❌ Verification timeout - verification FAILED`);
            
            await saveUnverifiedAccount(browserId, email, password, page, 'timeout');

            return false; // ❌ FAIL - timeout
        }
        
    } catch (error) {
        console.log(`[B-${browserId}] ❌ Verification error: ${error.message}`);
        
        await saveUnverifiedAccount(browserId, email, password, page, 'error');

        return false; // ❌ FAIL - error occurred
    }
}

async function clearAndType(page, element, text) {
    await element.focus();
    await page.evaluate((el) => {
        el.select();
        el.value = '';
    }, element);
    await element.type(text, { delay: 30 });
}

async function launchBrowser(browserId) {
    const extensionPath = path.join(__dirname, 'buster');
    const extensionExists = fsSync.existsSync(extensionPath);

    if (!extensionExists) {
        throw new Error('Buster extension not found at ./buster/');
    }

    const windowPos = getWindowPosition(browserId);

    return puppeteer.launch({
        headless: false,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-first-run",
            "--disable-default-apps",
            "--disable-popup-blocking",
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            `--window-size=320,520`,
            `--window-position=${windowPos.x},${windowPos.y}`
        ],
        defaultViewport: { width: 320, height: 520 }
    });
}

// SIGNUP ONLY FUNCTION - Saves to spotify.txt
async function signupOnly(browser, browserId) {
    let page;
    try {
        const email = generateEmail();
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const displayName = `${firstName} ${lastName}`;
        
        console.log(`[B-${browserId}] 🚀 SIGNUP ONLY: ${email}`);
        
        page = await browser.newPage();
        
        const userAgent = getRandomUserAgent();
        await page.setUserAgent(userAgent);
        
        await page.evaluate((browserId) => {
            document.title = `🚀 Spotify-${browserId} - SIGNUP ONLY`;
        }, browserId);
        
        await blockAllCookies(page, browserId);

        console.log(`[B-${browserId}] 📱 Loading signup...`);
        await page.goto('https://www.spotify.com/signup', {
            waitUntil: "domcontentloaded",
            timeout: 20000
        });

        await assertNotAutomationBlocked(page, browserId, 'signup page load');

        await fastDelay(2000);

        // Email step
        console.log(`[B-${browserId}] ✉️ Step 1: Email`);
        await page.waitForSelector("input[data-testid='email'], #username, input[name='username'], input[type='email']", { timeout: 10000 });
        
        const emailSelectors = [
            "input[data-testid='email']",
            "#username", 
            "input[name='username']",
            "input[type='email']"
        ];
        
        let emailFilled = false;
        for (const selector of emailSelectors) {
            const emailInput = await page.$(selector);
            if (emailInput) {
                await emailInput.click();
                await fastDelay(200);
                await emailInput.type(email, { delay: 30 });
                console.log(`[B-${browserId}] ✅ Email entered`);
                emailFilled = true;
                break;
            }
        }
        
        if (!emailFilled) {
            throw new Error("Email input not found");
        }

        await fastDelay(1000);
        await smartClickContinue(page, browserId);
        await fastDelay(2000);

        // Password step
        console.log(`[B-${browserId}] 🔐 Step 2: Password`);
        await page.waitForSelector("input[data-testid='password'], #new-password, input[name='password'], input[type='password']", { timeout: 10000 });
        
        const passwordSelectors = [
            "input[data-testid='password']",
            "#new-password",
            "input[name='password']", 
            "input[type='password']"
        ];
        
        let passwordFilled = false;
        for (const selector of passwordSelectors) {
            const passwordInput = await page.$(selector);
            if (passwordInput) {
                await passwordInput.click();
                await fastDelay(200);
                await passwordInput.type(config.password, { delay: 30 });
                console.log(`[B-${browserId}] ✅ Password entered`);
                passwordFilled = true;
                break;
            }
        }
        
        if (!passwordFilled) {
            throw new Error("Password input not found");
        }

        await fastDelay(1000);
        await smartClickContinue(page, browserId);
        await fastDelay(2000);

        // Profile info step
        console.log(`[B-${browserId}] 👤 Step 3: Profile`);
        await page.waitForSelector("input[data-testid='displayName'], #displayName, input[name='displayName']", { timeout: 10000 });
        
        const nameSelectors = [
            "input[data-testid='displayName']",
            "#displayName",
            "input[name='displayName']"
        ];
        
        for (const selector of nameSelectors) {
            const nameInput = await page.$(selector);
            if (nameInput) {
                await nameInput.click();
                await fastDelay(200);
                await nameInput.type(displayName, { delay: 30 });
                console.log(`[B-${browserId}] ✅ Name entered`);
                break;
            }
        }

        // Birth date
        const age = 18 + Math.floor(Math.random() * 8);
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        
        const day = birthDay.toString().padStart(2, '0');
        const month = birthMonth;
        const year = birthYear.toString();

        await fastDelay(500);

        const daySelectors = ["input[data-testid='day']", "#day", "input[name='day']"];
        for (const selector of daySelectors) {
            const dayInput = await page.$(selector);
            if (dayInput) {
                await clearAndType(page, dayInput, day);
                break;
            }
        }

        const monthSelectors = ["select[data-testid='month']", "#month", "select[name='month']"];
        for (const selector of monthSelectors) {
            const monthSelect = await page.$(selector);
            if (monthSelect) {
                await monthSelect.select(month.toString());
                break;
            }
        }

        const yearSelectors = ["input[data-testid='year']", "#year", "input[name='year']"];
        for (const selector of yearSelectors) {
            const yearInput = await page.$(selector);
            if (yearInput) {
                await clearAndType(page, yearInput, year);
                break;
            }
        }

        await fastDelay(500);

        try {
            const genderRadios = await page.$$("input[name='gender'], input[type='radio']");
            if (genderRadios.length > 0) {
                await genderRadios[0].click();
            }
        } catch (error) {
            // Skip gender if not found
        }

        await fastDelay(1000);
        await smartClickContinue(page, browserId);
        await fastDelay(2000);

        // Terms step
        console.log(`[B-${browserId}] 📋 Step 4: Terms`);
        await fastDelay(1000);
        
        try {
            const checkboxes = await page.$$('input[type="checkbox"]');
            for (const checkbox of checkboxes) {
                const isChecked = await page.evaluate(el => el.checked, checkbox);
                if (isChecked) {
                    await checkbox.click();
                }
            }
        } catch (error) {
            // Skip if no checkboxes
        }

        await fastDelay(500);

        // Final submit
        console.log(`[B-${browserId}] 🚀 Submitting...`);
        const finalSubmitSelectors = [
            "button[data-testid='submit']",
            "button[data-testid='signup']", 
            "button[type='submit']",
            ".Button-sc-qlcn5g-0"
        ];
        
        let submitted = false;
        for (const selector of finalSubmitSelectors) {
            try {
                const submitButton = await page.$(selector);
                if (submitButton) {
                    await submitButton.click();
                    console.log(`[B-${browserId}] ✅ Submitted`);
                    submitted = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!submitted) {
            throw new Error("Submit button not found");
        }

        // CAPTCHA HANDLING
        console.log(`[B-${browserId}] 🤖 Captcha check...`);
        await fastDelay(2000);
        
        let captchaAttempts = 0;
        const maxCaptchaAttempts = 3;

        while (captchaAttempts < maxCaptchaAttempts) {
            const captchaPresent = await page.evaluate(() => {
                return document.querySelector('iframe[src*="recaptcha"]') || 
                       document.querySelector('iframe[title*="challenge"]');
            });

            if (captchaPresent) {
                console.log(`[B-${browserId}] 🎯 Captcha detected (${captchaAttempts + 1}/${maxCaptchaAttempts})`);
                
                const captchaHandled = await handleCaptchaWithBuster(page, browserId, 3);
                
                if (captchaHandled) {
                    console.log(`[B-${browserId}] ✅ Captcha processed!`);
                    break;
                }
            } else {
                console.log(`[B-${browserId}] ✅ No captcha`);
                await smartClickContinue(page, browserId);
                break;
            }
            
            captchaAttempts++;
            await fastDelay(5000);
        }

        // Wait for signup completion
        console.log(`[B-${browserId}] ⏳ Waiting for completion...`);
        try {
            await page.waitForFunction(
                () => {
                    const url = window.location.href;
                    return (url.includes("spotify.com") && 
                           !url.includes("signup") &&
                           !url.includes("challenge") &&
                           !url.includes("error")) ||
                           url.includes("open.spotify.com") ||
                           url.includes("accounts.spotify.com");
                },
                { timeout: 45000 }
            );

            console.log(`[B-${browserId}] ✅ SIGNUP COMPLETED!`);
            
            const accountData = `${email}:${config.password}\n`;
            await fs.appendFile('spotify.txt', accountData);
            console.log(`[B-${browserId}] 💾 Saved to spotify.txt!`);
            console.log(`📧 ${email}`);
            console.log(`🔐 ${config.password}`);
            
            return true;

        } catch (error) {
            console.log(`[B-${browserId}] ❌ Failed: ${error.message}`);
            
            try {
                const accountData = `${email}:${config.password}\n`;
                await fs.appendFile('spotify.txt', accountData);
                console.log(`[B-${browserId}] 💾 Saved anyway!`);
                return true;
            } catch (saveError) {
                console.log(`[B-${browserId}] ❌ Save failed`);
                return false;
            }
        }

    } catch (error) {
        console.log(`[B-${browserId}] ❌ Error: ${error.message}`);
        return false;
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {}
        }
    }
}

// ✅ SIGNUP AND VERIFY FUNCTION - EACH ACCOUNT GETS UNIQUE LINK
async function signupAndVerify(browser, browserId) {
    let page;

    // ✅ GET UNIQUE LINK (immediately removed from pool)
    const spotifyLink = getNextLink();

    if (!spotifyLink) {
        console.log("❌ No verification links available!");
        return false;
    }

    // ✅ Assign link to this specific browser
    assignLinkToBrowser(browserId, spotifyLink);

    try {
        const email = generateEmail();
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const displayName = `${firstName} ${lastName}`;
        
        console.log(`[B-${browserId}] 🚀 SIGNUP + VERIFY: ${email}`);
        console.log(`[B-${browserId}] 🔗 Unique link assigned`);
        
        page = await browser.newPage();
        
        const userAgent = getRandomUserAgent();
        await page.setUserAgent(userAgent);
        
        await page.evaluate((browserId) => {
            document.title = `🚀 Spotify-${browserId} - SIGNUP + VERIFY`;
        }, browserId);
        
        await blockAllCookies(page, browserId);
        
        console.log(`[B-${browserId}] 📱 Loading signup...`);
        await page.goto('https://www.spotify.com/signup', {
            waitUntil: "domcontentloaded",
            timeout: 20000
        });

        await assertNotAutomationBlocked(page, browserId, 'signup page load');

        await fastDelay(2000);

        // Email step
        console.log(`[B-${browserId}] ✉️ Step 1: Email`);
        await page.waitForSelector("input[data-testid='email'], #username, input[name='username'], input[type='email']", { timeout: 10000 });
        
        const emailSelectors = [
            "input[data-testid='email']",
            "#username", 
            "input[name='username']",
            "input[type='email']"
        ];
        
        let emailFilled = false;
        for (const selector of emailSelectors) {
            const emailInput = await page.$(selector);
            if (emailInput) {
                await emailInput.click();
                await fastDelay(200);
                await emailInput.type(email, { delay: 30 });
                console.log(`[B-${browserId}] ✅ Email entered`);
                emailFilled = true;
                break;
            }
        }
        
        if (!emailFilled) {
            throw new Error("Email input not found");
        }

        await fastDelay(1000);
        await smartClickContinue(page, browserId);
        await fastDelay(2000);

        // Password step
        console.log(`[B-${browserId}] 🔐 Step 2: Password`);
        await page.waitForSelector("input[data-testid='password'], #new-password, input[name='password'], input[type='password']", { timeout: 10000 });
        
        const passwordSelectors = [
            "input[data-testid='password']",
            "#new-password",
            "input[name='password']", 
            "input[type='password']"
        ];
        
        let passwordFilled = false;
        for (const selector of passwordSelectors) {
            const passwordInput = await page.$(selector);
            if (passwordInput) {
                await passwordInput.click();
                await fastDelay(200);
                await passwordInput.type(config.password, { delay: 30 });
                console.log(`[B-${browserId}] ✅ Password entered`);
                passwordFilled = true;
                break;
            }
        }
        
        if (!passwordFilled) {
            throw new Error("Password input not found");
        }

        await fastDelay(1000);
        await smartClickContinue(page, browserId);
        await fastDelay(2000);

        // Profile info step
        console.log(`[B-${browserId}] 👤 Step 3: Profile`);
        await page.waitForSelector("input[data-testid='displayName'], #displayName, input[name='displayName']", { timeout: 10000 });
        
        const nameSelectors = [
            "input[data-testid='displayName']",
            "#displayName",
            "input[name='displayName']"
        ];
        
        for (const selector of nameSelectors) {
            const nameInput = await page.$(selector);
            if (nameInput) {
                await nameInput.click();
                await fastDelay(200);
                await nameInput.type(displayName, { delay: 30 });
                console.log(`[B-${browserId}] ✅ Name entered`);
                break;
            }
        }

        // Birth date
        const age = 18 + Math.floor(Math.random() * 8);
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        
        const day = birthDay.toString().padStart(2, '0');
        const month = birthMonth;
        const year = birthYear.toString();

        await fastDelay(500);

        const daySelectors = ["input[data-testid='day']", "#day", "input[name='day']"];
        for (const selector of daySelectors) {
            const dayInput = await page.$(selector);
            if (dayInput) {
                await clearAndType(page, dayInput, day);
                break;
            }
        }

        const monthSelectors = ["select[data-testid='month']", "#month", "select[name='month']"];
        for (const selector of monthSelectors) {
            const monthSelect = await page.$(selector);
            if (monthSelect) {
                await monthSelect.select(month.toString());
                break;
            }
        }

        const yearSelectors = ["input[data-testid='year']", "#year", "input[name='year']"];
        for (const selector of yearSelectors) {
            const yearInput = await page.$(selector);
            if (yearInput) {
                await clearAndType(page, yearInput, year);
                break;
            }
        }

        await fastDelay(500);

        try {
            const genderRadios = await page.$$("input[name='gender'], input[type='radio']");
            if (genderRadios.length > 0) {
                await genderRadios[0].click();
            }
        } catch (error) {
            // Skip gender if not found
        }

        await fastDelay(1000);
        await smartClickContinue(page, browserId);
        await fastDelay(2000);

        // Terms step
        console.log(`[B-${browserId}] 📋 Step 4: Terms`);
        await fastDelay(1000);
        
        try {
            const checkboxes = await page.$$('input[type="checkbox"]');
            for (const checkbox of checkboxes) {
                const isChecked = await page.evaluate(el => el.checked, checkbox);
                if (isChecked) {
                    await checkbox.click();
                }
            }
        } catch (error) {
            // Skip if no checkboxes
        }

        await fastDelay(500);

        // Final submit
        console.log(`[B-${browserId}] 🚀 Submitting...`);
        const finalSubmitSelectors = [
            "button[data-testid='submit']",
            "button[data-testid='signup']", 
            "button[type='submit']",
            ".Button-sc-qlcn5g-0"
        ];
        
        let submitted = false;
        for (const selector of finalSubmitSelectors) {
            try {
                const submitButton = await page.$(selector);
                if (submitButton) {
                    await submitButton.click();
                    console.log(`[B-${browserId}] ✅ Submitted`);
                    submitted = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!submitted) {
            throw new Error("Submit button not found");
        }

        // CAPTCHA HANDLING
        console.log(`[B-${browserId}] 🤖 Captcha check...`);
        await fastDelay(2000);
        
        let captchaAttempts = 0;
        const maxCaptchaAttempts = 3;

        while (captchaAttempts < maxCaptchaAttempts) {
            const captchaPresent = await page.evaluate(() => {
                return document.querySelector('iframe[src*="recaptcha"]') || 
                       document.querySelector('iframe[title*="challenge"]');
            });

            if (captchaPresent) {
                console.log(`[B-${browserId}] 🎯 Captcha detected (${captchaAttempts + 1}/${maxCaptchaAttempts})`);
                
                const captchaHandled = await handleCaptchaWithBuster(page, browserId, 3);
                
                if (captchaHandled) {
                    console.log(`[B-${browserId}] ✅ Captcha processed!`);
                    break;
                }
            } else {
                console.log(`[B-${browserId}] ✅ No captcha`);
                await smartClickContinue(page, browserId);
                break;
            }
            
            captchaAttempts++;
            await fastDelay(5000);
        }

        // Wait for signup completion
        console.log(`[B-${browserId}] ⏳ Waiting for completion...`);
        try {
            await page.waitForFunction(
                () => {
                    const url = window.location.href;
                    return (url.includes("spotify.com") && 
                           !url.includes("signup") &&
                           !url.includes("challenge") &&
                           !url.includes("error")) ||
                           url.includes("open.spotify.com") ||
                           url.includes("accounts.spotify.com");
                },
                { timeout: 45000 }
            );

            console.log(`[B-${browserId}] ✅ SIGNUP COMPLETED!`);
            
            // ✅ Now proceed to STRICT verification
            console.log(`[B-${browserId}] 🎓 Proceeding to STRICT verification...`);
            
            const verificationSuccess = await verifyStudentAccount(page, browserId, spotifyLink, email, config.password);
            
            if (verificationSuccess) {
                console.log(`[B-${browserId}] 🎉 COMPLETE SUCCESS - VERIFIED!`);
                
                // ✅ Mark link as successfully used (permanently removed)
                markLinkAsUsed(browserId, spotifyLink);
                
                console.log(`📧 ${email}`);
                console.log(`🔐 ${config.password}`);
                
                return true; // ✅ TRUE = Success, link removed forever
            } else {
                console.log(`[B-${browserId}] ❌ Verification FAILED`);
                
                // ✅ Return link to pool for retry
                returnLinkToPool(browserId, spotifyLink);
                
                console.log(`📧 ${email} (saved to unverified.txt)`);
                console.log(`🔐 ${config.password}`);
                
                return false; // ❌ FALSE = Failed, link returned to pool
            }

        } catch (error) {
            console.log(`[B-${browserId}] ❌ Signup failed: ${error.message}`);
            
            // ✅ Return link to pool on error
            returnLinkToPool(browserId, spotifyLink);
            
            return false; // ❌ Link returned to pool
        }

    } catch (error) {
        console.log(`[B-${browserId}] ❌ Error: ${error.message}`);
        
        // ✅ Return link to pool on error
        returnLinkToPool(browserId, spotifyLink);

        return false; // ❌ Link returned to pool
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {}
        }
    }
}

async function ensureConfig() {
    try {
        await fs.access('./config.json');
        return true;
    } catch (error) {
        const defaultConfig = {
            "domain": "puella.shop",
            "password": "Meow@12345",
            "threads": 5
        };
        await fs.writeFile('./config.json', JSON.stringify(defaultConfig, null, 2));
        console.log("[+] Default config.json created");
        return true;
    }
}

async function getUserPreferences() {
    console.log("\n🎯 MODE SELECTION");
    console.log("=================");
    console.log("1 - Signup Only (saves to spotify.txt)");
    console.log("2 - Signup + STRICT Auto Verify (saves to verifiedstudent.txt)");
    console.log("   ✅ Each account gets 1 unique link");
    console.log("   🔄 Failed verifications return link to pool");
    console.log("   ⚠️ Failed accounts saved to unverified.txt");
    
    const modeAnswer = await askQuestion(`\n🔢 Choose mode (1 or 2): `);
    userMode = parseInt(modeAnswer) || 1;
    
    if (userMode === 2 && availableLinks.length === 0) {
        console.log("❌ No verification links available for mode 2. Switching to mode 1.");
        userMode = 1;
    }
    
    console.log("\n🎯 CONFIGURATION SETUP");
    console.log("=======================");
    
    const browserAnswer = await askQuestion(`🔢 How many browsers to run simultaneously? (default: 5): `);
    userBrowserCount = browserAnswer.trim() === '' ? 5 : parseInt(browserAnswer) || 5;
    
    const accountAnswer = await askQuestion(`🎯 How many verified accounts to create? (default: 10): `);
    userAccountTarget = accountAnswer.trim() === '' ? 10 : parseInt(accountAnswer) || 10;
    
    console.log(`\n✅ Configuration set:`);
    console.log(`🎯 Mode: ${userMode === 1 ? 'Signup Only (spotify.txt)' : 'Signup + STRICT Verify (verifiedstudent.txt)'}`);
    console.log(`🔢 Browsers: ${userBrowserCount}`);
    console.log(`🎯 Target: ${userAccountTarget} verified accounts`);
    if (userMode === 2) {
        console.log(`📋 Links available: ${availableLinks.length}`);
        console.log(`✅ Verified → verifiedstudent.txt`);
        console.log(`⚠️ Failed → unverified.txt (link returned to pool)`);
    }
    
    rl.close();
}

async function main() {
    console.log("🎵 Spotify Student Account Creator - 🎓 1 LINK PER ACCOUNT");
    console.log("============================================================");
    console.log("✅ Mode 1: Signup Only → spotify.txt");
    console.log("✅ Mode 2: Signup + STRICT Verify → verifiedstudent.txt");
    console.log("🔗 Each account gets 1 UNIQUE link (removed immediately)");
    console.log("✅ Successful verification → Link deleted forever");
    console.log("🔄 Failed verification → Link returned to pool for retry");
    console.log("⚠️ Failed accounts → unverified.txt");
    console.log("🎯 Smart Continue clicker + Enhanced Buster\n");
    
    const configExists = await ensureConfig();
    if (!configExists) {
        return;
    }
    
    availableLinks = await loadLinks();
    
    await getUserPreferences();
    
    if (userMode === 2) {
        if (availableLinks.length === 0) {
            console.log("❌ No links available for verification mode!");
            return;
        }
    }
    
    const extensionPath = path.join(__dirname, 'buster');
    if (!fsSync.existsSync(extensionPath)) {
        console.log("❌ Buster extension not found at ./buster/");
        return;
    }
    
    console.log(`🎯 Starting with ${userBrowserCount} parallel browsers...\n`);
    console.log(`🎯 Mode: ${userMode === 1 ? 'SIGNUP ONLY' : 'SIGNUP + STRICT VERIFY'}`);
    console.log(`💾 Saving to: ${userMode === 1 ? 'spotify.txt' : 'verifiedstudent.txt + unverified.txt'}\n`);

    const workerCount = userMode === 1
        ? userBrowserCount
        : Math.min(userBrowserCount, availableLinks.length);

    if (workerCount <= 0) {
        console.log("🏁 No available workers to start!");
        return;
    }

    const worker = async (workerId) => {
        while (totalSuccessful < userAccountTarget && (userMode === 1 || availableLinks.length > 0)) {
            let browser;

            try {
                browser = await launchBrowser(workerId);

                const result = userMode === 1
                    ? await signupOnly(browser, workerId)
                    : await signupAndVerify(browser, workerId);

                totalAttempts++;

                if (result) {
                    totalSuccessful++;
                    console.log(`🎯 Progress: ${totalSuccessful}/${userAccountTarget} verified accounts`);
                }

                if (userMode === 2 && availableLinks.length === 0) {
                    console.log(`📝 Worker #${workerId} stopping - no more links.`);
                    break;
                }
            } catch (iterationError) {
                console.log(`[B-${workerId}] ⚠️ Worker iteration error: ${iterationError.message}`);
                await fastDelay(500);
            } finally {
                if (browser) {
                    try {
                        await browser.close();
                    } catch (e) {}
                }
            }
        }
    };

    const workers = Array(workerCount).fill().map((_, index) => worker(index + 1));
    await Promise.all(workers);

    if (userMode === 2) {
        await updateLinksFile();
    }

    const successRate = totalAttempts === 0 ? 0 : ((totalSuccessful / totalAttempts) * 100);

    console.log(`\n🏁 === FINAL RESULTS ===`);
    console.log(`✅ Verified accounts: ${totalSuccessful}/${userAccountTarget}`);
    console.log(`📊 Success rate: ${successRate.toFixed(1)}%`);
    if (userMode === 2) {
        console.log(`📋 Links used successfully: ${usedLinks.length}`);
        console.log(`📋 Links remaining in pool: ${availableLinks.length}`);
        console.log(`💾 Verified accounts: verifiedstudent.txt`);
        console.log(`⚠️ Failed verifications: unverified.txt`);
        console.log(`🔄 Failed links returned to pool for retry`);
    } else {
        console.log(`💾 All accounts: spotify.txt`);
    }
}

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    console.log(`✅ Total verified: ${totalSuccessful || 0}`);
    
    if (userMode === 2) {
        console.log(`📋 Links used: ${usedLinks.length}`);
        console.log(`📋 Links remaining: ${availableLinks.length}`);
        console.log(`⚙️ Links currently assigned: ${assignedLinks.size}`);
        
        // Return any assigned links back to pool
        if (assignedLinks.size > 0) {
            console.log(`🔄 Returning ${assignedLinks.size} assigned links to pool...`);
            for (const [browserId, link] of assignedLinks.entries()) {
                availableLinks.unshift(link);
            }
            assignedLinks.clear();
        }
        
        await updateLinksFile();
    }
    
    rl.close();
    process.exit(0);
});

main().catch(console.error);