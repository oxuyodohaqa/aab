"""
ChatGPT Account Creator Automation Script
This script automates the creation of ChatGPT accounts using temporary browser data.
Based on chahid_automation_advanced.py structure.
"""

import asyncio
import os
import json
import random
import string
import time
import uuid
import shutil
import tempfile
import requests
import subprocess
import sys
from datetime import datetime, timedelta
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from typing import List, Dict, Optional
import threading


class ChatGPTAccountCreator:    
    def __init__(self):
        self.accounts_file = 'accounts.txt'
        self.admin_key = "Salah123.ss"
        self.email_api_url = "https://mailt.stafflazarus.com/api/get-last-email"
        self.tmail_base_url = "https://userghost.com/api"
        self.tmail_api_key = "MSU9cb6pJDH8RnFkWrmQ"
        self.created_accounts = []
        self.config_file = 'config.json'
        self.domains_file = 'domains.txt'
        self.config = self.load_config()
        self.max_workers = self.config.get('max_workers', 3)
        self.account_lock = threading.Lock()  # Thread-safe account saving
        self.pro_domains = self.load_domains()
        self.ensure_playwright_firefox()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_message = f"[{timestamp}] [{level}] {message}"
        print(log_message)
    
    def load_config(self) -> dict:
        default_config = {
            'max_workers': 3,
            'headless': True,
            'slow_mo': 1000,
            'timeout': 30000,
            'password': None
        }
        
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    default_config.update(config)
                    
                    if default_config.get('password'):
                        password = default_config['password']
                        if len(password) < 12:
                            self.log(f"⚠️ Warning: Password in config.json is less than 12 characters. ChatGPT requires at least 12 characters.", "WARNING")
                    
                    return default_config
            else:
                with open(self.config_file, 'w', encoding='utf-8') as f:
                    json.dump(default_config, f, indent=2)
                self.log(f"📝 Created default config file: {self.config_file}")
                return default_config
        except Exception as e:
            self.log(f"⚠️ Error loading config: {e}, using defaults", "WARNING")
            return default_config
    
    def load_domains(self) -> List[str]:
        default_domains = [
            'stafflazarus.com',
            'userghost.com',
            'ngedit.my.id',
            'cogil.my.id',
            'cegil.my.id',
            'canpapro.my.id'
        ]  # Fallback if file doesn't exist

        api_domains = self.fetch_tmail_domains()
        if api_domains:
            return api_domains

        try:
            if os.path.exists(self.domains_file):
                with open(self.domains_file, 'r', encoding='utf-8') as f:
                    domains = []
                    for line in f:
                        line = line.strip()
                        # Skip empty lines and comments
                        if line and not line.startswith('#'):
                            domains.append(line)

                    if domains:
                        return domains
                    else:
                        return default_domains
            else:
                # Create default domains.txt file
                with open(self.domains_file, 'w', encoding='utf-8') as f:
                    f.write("stafflazarus.com\n")
                return default_domains
        except Exception:
            return default_domains

    def fetch_tmail_domains(self) -> List[str]:
        """Fetch available domains from the Tmail API."""
        try:
            response = requests.get(
                f"{self.tmail_base_url}/domains/{self.tmail_api_key}", timeout=15
            )
            if response.ok:
                data = response.json()
                if isinstance(data, list):
                    domains = data
                elif isinstance(data, dict):
                    domains = data.get('data') or data.get('domains') or data
                else:
                    domains = []
                if isinstance(domains, list) and domains:
                    cleaned = [d.strip() for d in domains if d and isinstance(d, str)]
                    if cleaned:
                        self.log(f"📝 Loaded {len(cleaned)} domain(s) from Tmail API")
                        return cleaned
        except Exception as e:
            self.log(f"⚠️ Error fetching Tmail domains: {e}", "WARNING")
        return []
    
    def ensure_playwright_firefox(self):
        try:
            from playwright.sync_api import sync_playwright
            
            with sync_playwright() as p:
                try:
                    browser = p.firefox.launch(headless=True)
                    browser.close()
                    #self.log("✅ Playwright Firefox is already installed")
                    return
                except Exception as e:pass
            
        except ImportError:
            #self.log("⚠️ Playwright not found, please install it first: pip install playwright", "WARNING")
            return
        except Exception as e:pass
        
        try:
            #self.log("📥 Installing Playwright Firefox (this may take a few minutes)...")
            result = subprocess.run(
                [sys.executable, "-m", "playwright", "install", "firefox"],
                capture_output=True,
                text=True,
                timeout=600  # 10 minutes timeout for installation
            )
        except Exception as e:pass
    
    def create_tmail_email(self) -> Optional[str]:
        """Create an inbox using the Tmail API (UserGhost)."""
        if not self.pro_domains:
            return None

        domain = random.choice(self.pro_domains)
        try:
            response = requests.get(
                f"{self.tmail_base_url}/email/create/{self.tmail_api_key}",
                params={'domain': domain},
                timeout=15
            )
            if response.ok:
                email_address = response.text.strip()
                if '@' in email_address and '.' in email_address:
                    self.log(f"✅ Tmail email created: {email_address}")
                    return email_address
                self.log(f"⚠️ Unexpected email response: {email_address}", "WARNING")
        except Exception as e:
            self.log(f"⚠️ Error creating Tmail email: {e}", "WARNING")
        return None

    def generate_random_email(self) -> str:
        if not self.pro_domains:
            self.log("❌ No domains available! Please add domains to domains.txt", "ERROR")
            raise ValueError("No domains available")

        tmail_email = self.create_tmail_email()
        if tmail_email:
            return tmail_email

        username_length = random.randint(8, 12)
        username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=username_length))

        domain = random.choice(self.pro_domains)

        return f"{username}@{domain}"
    
    def generate_random_password(self) -> str:
        uppercase = string.ascii_uppercase
        lowercase = string.ascii_lowercase
        digits = string.digits
        special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        password = [
            random.choice(uppercase),
            random.choice(lowercase),
            random.choice(digits),
            random.choice(special)
        ]
        
        remaining_length = random.randint(8, 12)
        all_chars = uppercase + lowercase + digits + special
        password.extend(random.choices(all_chars, k=remaining_length))
        
        random.shuffle(password)
        
        return ''.join(password)
    
    def generate_random_name(self) -> str:
        first_names = [
            'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
            'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
            'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
            'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan',
            'Sarah', 'Emily', 'Jessica', 'Jennifer', 'Ashley', 'Amanda', 'Melissa', 'Nicole',
            'Michelle', 'Elizabeth', 'Kimberly', 'Amy', 'Angela', 'Stephanie', 'Rachel', 'Lauren',
            'Lisa', 'Megan', 'Samantha', 'Rebecca'
        ]
        
        last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
            'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
            'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young',
            'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
            'Green', 'Adams', 'Nelson', 'Baker', 'Campbell', 'Mitchell', 'Roberts', 'Carter'
        ]
        
        return f"{random.choice(first_names)} {random.choice(last_names)}"
    
    def generate_random_birthday(self) -> Dict[str, int]:
        today = datetime.now()
        min_year = today.year - 65  
        max_year = today.year - 18
        
        year = random.randint(min_year, max_year)
        month = random.randint(1, 12)
        
        if month in [1, 3, 5, 7, 8, 10, 12]:
            max_day = 31
        elif month in [4, 6, 9, 11]:
            max_day = 30
        else:
            if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
                max_day = 29
            else:
                max_day = 28
        
        day = random.randint(1, max_day)
        
        return {
            'year': year,
            'month': month,
            'day': day
        }
    
    def save_account(self, email: str, password: str):
        """Save account to accounts.txt file (thread-safe)"""
        try:
            with self.account_lock:
                # Add to list
                self.created_accounts.append({'email': email, 'password': password})
                
                # Append to file
                with open(self.accounts_file, 'a', encoding='utf-8') as f:
                    f.write(f"{email}:{password}\n")
                
                self.log(f"💾 Saved account to {self.accounts_file}: {email}")
            
        except Exception as e:
            self.log(f"❌ Error saving account: {str(e)}", "ERROR")
    
    def extract_otp_from_html(self, html_content: str) -> Optional[str]:
        """Extract a 6-digit OTP from HTML or plain text content."""
        if not html_content:
            return None

        match = re.search(r'\b(\d{6})\b', html_content)
        if match:
            return match.group(1)

        match = re.search(r'Your ChatGPT code is (\d{6})', html_content, re.IGNORECASE)
        if match:
            return match.group(1)

        text = re.sub(r'<[^>]+>', ' ', html_content)
        patterns = [
            r'verification code[:\s]*(\d{6})',
            r'code[:\s]*(\d{6})',
            r'\b(\d{6})\b',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)

        return None

    def get_verification_code_from_tmail(self, email: str, max_wait: int = 120) -> Optional[str]:
        """Check the UserGhost Tmail inbox for a ChatGPT OTP."""
        if not email:
            return None

        self.log(f"⏳ Checking Tmail inbox for {email} (max {max_wait}s)...")
        start_time = time.time()
        endpoint_patterns = [
            f"email/{email}/messages/{self.tmail_api_key}",
            f"messages/{email}/{self.tmail_api_key}",
            f"inbox/{email}/{self.tmail_api_key}",
            f"mail/{email}/{self.tmail_api_key}",
        ]

        while (time.time() - start_time) < max_wait:
            for endpoint in endpoint_patterns:
                try:
                    url = f"{self.tmail_base_url}/{endpoint}"
                    response = requests.get(url, timeout=15)
                    if not response.ok:
                        continue

                    content = response.text.strip()
                    if not content or len(content) < 20:
                        continue

                    try:
                        data = response.json()
                        messages = None
                        if isinstance(data, list) and data:
                            messages = data
                        elif isinstance(data, dict):
                            messages = data.get('messages') or data.get('data') or data.get('emails')

                        if messages:
                            message = messages[0] if isinstance(messages, list) else messages
                            html_body = ''
                            if isinstance(message, dict):
                                html_body = (
                                    message.get('html') or
                                    message.get('body_html') or
                                    message.get('html_body') or
                                    message.get('content') or
                                    message.get('body') or
                                    str(message)
                                )
                            else:
                                html_body = str(message)

                            otp = self.extract_otp_from_html(html_body)
                            if otp:
                                elapsed = time.time() - start_time
                                self.log(f"🔑 OTP found via Tmail: {otp} ({elapsed:.1f}s)")
                                return otp
                    except ValueError:
                        otp = self.extract_otp_from_html(content)
                        if otp:
                            elapsed = time.time() - start_time
                            self.log(f"🔑 OTP found via Tmail: {otp} ({elapsed:.1f}s)")
                            return otp
                except Exception:
                    continue

            time.sleep(3)

        self.log(f"❌ Timeout waiting for Tmail OTP ({max_wait}s)", "ERROR")
        return None

    def get_verification_code(self, email: str, max_retries: int = 5, delay: int = 2, max_wait: int = 120) -> Optional[str]:
        """Get verification code from Tmail first, then fallback API."""
        code = self.get_verification_code_from_tmail(email, max_wait=max_wait)
        if code:
            return code

        for attempt in range(max_retries):
            try:
                payload = {
                    "adminKey": self.admin_key,
                    "email": email
                }

                response = requests.post(
                    self.email_api_url,
                    json=payload,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and data.get('email'):
                        subject = data['email'].get('subject', '')
                        if 'code is' in subject.lower():
                            code_match = re.search(r'code is\s+(\d+)', subject, re.IGNORECASE)
                            if code_match:
                                code = code_match.group(1)
                                self.log(f"✅ Retrieved verification code: {code}")
                                return code

                if attempt < max_retries - 1:
                    self.log(f"⏳ Code not found, waiting {delay}s before retry {attempt + 1}/{max_retries}...")
                    time.sleep(delay)

            except Exception as e:
                self.log(f"⚠️ Error fetching verification code (attempt {attempt + 1}): {e}", "WARNING")
                if attempt < max_retries - 1:
                    time.sleep(delay)

        self.log(f"❌ Failed to get verification code after {max_retries} attempts", "ERROR")
        return None
    
    async def create_account(self, account_number: int, total_accounts: int) -> bool:
        email = self.generate_random_email()
        password = self.config.get('password')
        if not password:
            self.log("❌ Error: No password found in config.json! Please add a 'password' field to config.json", "ERROR")
            return False
        if len(password) < 12:
            self.log(f"⚠️ Warning: Password in config.json is only {len(password)} characters. ChatGPT requires at least 12 characters.", "WARNING")
        name = self.generate_random_name()
        birthday = self.generate_random_birthday()
        
        self.log(f"🚀 Creating account {account_number}/{total_accounts}: {email}")
        
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        temp_dir = tempfile.mkdtemp(prefix=f"chatgpt_browser_{account_number}_{timestamp}_{unique_id}_")
        
        try:
            async with async_playwright() as p:
                firefox_version = "131.0"  
                
                firefox_args = [
                ]
                
                user_agent = f'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:{firefox_version}) Gecko/20100101 Firefox/{firefox_version}'
                
                extra_http_headers = {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Cache-Control': 'max-age=0',
                }
                
                firefox_user_prefs = {
                    'dom.webdriver.enabled': False,
                    'useAutomationExtension': False,
                    'marionette.enabled': False,
                }
                
                context = await p.firefox.launch_persistent_context(
                    user_data_dir=temp_dir,
                    headless=True,
                    viewport={'width': 1920, 'height': 1080},  # Match common resolution
                    user_agent=user_agent,
                    locale='en-US',  # Set locale
                    timezone_id='America/New_York',  # Set timezone
                    device_scale_factor=1,
                    has_touch=False,
                    is_mobile=False,
                    ignore_https_errors=True,
                    bypass_csp=True,
                    extra_http_headers=extra_http_headers,
                    firefox_user_prefs=firefox_user_prefs,
                    timeout=30000,
                )
                
                pages = context.pages
                page = pages[0] if pages else await context.new_page()
                
                firefox_stealth_script = """
                (function() {
                    // Hide webdriver property (Firefox)
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                        configurable: true
                    });
                    
                    // Override plugins to look realistic
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => {
                            return {
                                length: 0,
                                item: function() { return null; },
                                namedItem: function() { return null; },
                                refresh: function() {}
                            };
                        },
                        configurable: true
                    });
                    
                    // Override languages
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en'],
                        configurable: true
                    });
                    
                    // Override permissions query
                    const originalQuery = window.navigator.permissions.query;
                    if (originalQuery) {
                        window.navigator.permissions.query = (parameters) => (
                            parameters.name === 'notifications' ?
                                Promise.resolve({ state: Notification.permission }) :
                                originalQuery(parameters)
                        );
                    }
                    
                    // Remove automation indicators
                    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
                    
                    // Firefox-specific: Hide marionette
                    delete navigator.__marionette;
                    delete navigator.__fxdriver;
                    delete navigator._driver;
                    delete navigator._selenium;
                    delete navigator.__driver_evaluate;
                    delete navigator.__webdriver_evaluate;
                    delete navigator.__selenium_evaluate;
                    delete navigator.__fxdriver_evaluate;
                    delete navigator.__driver_unwrapped;
                    delete navigator.__webdriver_unwrapped;
                    delete navigator.__selenium_unwrapped;
                    delete navigator.__fxdriver_unwrapped;
                })();
                """
                
                await page.add_init_script(firefox_stealth_script)
                #self.log("✅ Firefox stealth script injected (webdriver hiding)")
                
                # Step 1: Navigate to ChatGPT and verify browser_info matches MCP
                #self.log(f"📱 Navigating to ChatGPT signup page...")
                try:
                    await page.goto('https://chatgpt.com/', wait_until='domcontentloaded', timeout=30000)
                    await asyncio.sleep(2)
                    
                    browser_info = await page.evaluate("""
                        () => {
                            return {
                                webdriver: navigator.webdriver,
                                userAgent: navigator.userAgent,
                                languages: navigator.languages,
                                platform: navigator.platform,
                                plugins: navigator.plugins.length,
                                cookieEnabled: navigator.cookieEnabled,
                                onLine: navigator.onLine
                            }
                        }
                    """)
                    
                    #self.log(f"🔍 Browser Info Check (Firefox):")
                    #self.log(f"   webdriver: {browser_info['webdriver']}")
                    #self.log(f"   User-Agent: {browser_info['userAgent'][:80]}...")
                    
                        
                except Exception as e:
                    self.log(f"❌ Error navigating to ChatGPT: {e}", "ERROR")
                    return False
                
                self.log("🔘 Proccessing 'Sign up '")
                try:
                    signup_button = page.get_by_role('button', name='Sign up for free')
                    await signup_button.click(timeout=10000)
                    
                    await asyncio.sleep(random.uniform(1, 2))  # Random wait like human
                    
                    try:
                        email_input_check = page.get_by_role('textbox', name='Email address')
                        await email_input_check.wait_for(state='visible', timeout=5000)
                        #self.log("✅ Signup dialog appeared successfully")
                    except:
                        self.log("⚠️ Dialog might not have appeared, continuing anyway...", "WARNING")
                    
                except Exception as e:
                    self.log(f"❌ Error processing signup")
                    return False
                
                #self.log(f"📧 email: {email}")
                try:
                    email_input = page.get_by_role('textbox', name='Email address')
                    await email_input.wait_for(state='visible', timeout=15000)
                    
                    await email_input.fill(email)
                    
                    await email_input.blur()
                    
                    await asyncio.sleep(random.uniform(2, 3))  # Give time for validation
                    
                    continue_button = page.get_by_role('button', name='Continue', exact=True)
                    await continue_button.wait_for(state='visible', timeout=10000)
                    
                    is_enabled = await continue_button.is_enabled()
                    if not is_enabled:
                        self.log("⏳ Continue button not enabled yet, waiting for validation...")
                        await asyncio.sleep(2)
                    
                    await asyncio.sleep(random.uniform(0.5, 1))
                    
                except Exception as e:
                    #self.log(f"❌ Error filling email: {e}", "ERROR")
                    return False
                
                #self.log("🔘 Clicking Continue...")
                try:
                    async with page.expect_navigation(wait_until='domcontentloaded', timeout=15000) as navigation_info:
                        continue_button = page.get_by_role('button', name='Continue', exact=True)
                        await continue_button.click(timeout=10000)
                    
                    await asyncio.sleep(1)
                    
                    current_url = page.url
                    #self.log(f"📍 Current URL after Continue: {current_url}")
                    
                    if 'password' in current_url.lower() or 'auth.openai.com' in current_url.lower():
                        self.log(f"✅ Setuping password")
                    elif 'error' in current_url.lower():
                        page_text = await page.evaluate("() => document.body ? document.body.innerText : ''")
                        return False
                        
                except Exception as e:
                    current_url = page.url
                    
                    if 'error' in current_url.lower():
                        page_text = await page.evaluate("() => document.body ? document.body.innerText : ''")
                        return False
                    else:
                        await asyncio.sleep(2)
                        current_url = page.url
                        if 'error' in current_url.lower():
                            return False
                        elif 'password' not in current_url.lower():
                            return False
                
                #self.log("🔑 Filling password...")
                try:
                    password_input = page.get_by_role('textbox', name='Password')
                    await password_input.wait_for(state='visible', timeout=15000)
                    
                    await password_input.fill(password)
                    await asyncio.sleep(random.uniform(1, 2))
                except Exception as e:
                    #self.log(f"❌ Error filling password: {e}", "ERROR")
                    return False
                
                #self.log("🔘 Clicking Continue...")
                try:
                    continue_button = page.get_by_role('button', name='Continue')
                    await continue_button.wait_for(state='visible', timeout=15000)
                    
                    is_enabled = await continue_button.is_enabled()
                    if not is_enabled:
                        self.log("⏳ Button not enabled yet, waiting...")
                        await asyncio.sleep(2)
                    
                    box = await continue_button.bounding_box()
                    if box:
                        await page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
                        await asyncio.sleep(random.uniform(0.3, 0.7))
                    
                    try:
                        async with page.expect_navigation(wait_until='domcontentloaded', timeout=15000):
                            await continue_button.click(timeout=10000)
                        await asyncio.sleep(random.uniform(2, 3))
                    except:
                        await continue_button.click(timeout=10000)
                        await asyncio.sleep(random.uniform(2, 3))
                except Exception as e:
                    self.log(f"❌ Error clicking Continue: {e}", "ERROR")
                    return False
                
                self.log("⏳ Waiting for verification code...")
                await asyncio.sleep(8)
                
                #self.log("📨 Fetching verification code from email API...")
                verification_code = self.get_verification_code(email)
                
                if not verification_code:
                    self.log(f"❌ Failed to get verification code for {email}", "ERROR")
                    await context.close()
                    return False
                
                #self.log(f"🔢 Entering verification code: {verification_code}")
                try:
                    code_input = page.get_by_role('textbox', name='Code')
                    await code_input.fill(verification_code)
                    await asyncio.sleep(0.5)
                except Exception as e:
                    #self.log(f"❌ Error filling verification code: {e}", "ERROR")
                    return False
                
                #self.log("🔘 Clicking Continue...")
                try:
                    continue_button = page.get_by_role('button', name='Continue')
                    await continue_button.click(timeout=10000)
                    await asyncio.sleep(3)
                except Exception as e:
                    #self.log(f"❌ Error clicking Continue: {e}", "ERROR")
                    return False
                
                #self.log(f"👤 Filling name: {name}")
                try:
                    name_input = page.get_by_role('textbox', name='Full name')
                    await name_input.fill(name)
                    await asyncio.sleep(0.5)
                except Exception as e:
                    #self.log(f"❌ Error filling name: {e}", "ERROR")
                    return False
                
                month_num = birthday['month']  # Numeric month (1-12)
                day_num = birthday['day']  # Numeric day (1-31)
                year_num = birthday['year']  # Full year (YYYY)
                
                #self.log(f"🎂 Setting birthday: {month_num}/{day_num}/{year_num}")
                
                birthday_elements = None
                
                try:
                    birthday_info = await page.evaluate("""
                    () => {
                        // Find all possible birthday-related elements
                        const elements = [];
                        
                        // Try different selectors
                        const selectors = [
                            '[role="spinbutton"][aria-label*="month"]',
                            '[role="spinbutton"][aria-label*="day"]',
                            '[role="spinbutton"][aria-label*="year"]',
                            '[aria-label*="Birthday"]',
                            '[aria-label*="birthday"]',
                            'input[placeholder*="MM"]',
                            'input[placeholder*="DD"]',
                            'input[placeholder*="YYYY"]',
                            'input[type="text"][name*="month"]',
                            'input[type="text"][name*="day"]',
                            'input[type="text"][name*="year"]',
                            'input[type="number"]'
                        ];
                        
                        selectors.forEach(selector => {
                            try {
                                const els = document.querySelectorAll(selector);
                                els.forEach(el => {
                                    const rect = el.getBoundingClientRect();
                                    elements.push({
                                        selector: selector,
                                        tagName: el.tagName,
                                        role: el.getAttribute('role'),
                                        ariaLabel: el.getAttribute('aria-label'),
                                        name: el.getAttribute('name'),
                                        placeholder: el.getAttribute('placeholder'),
                                        id: el.getAttribute('id'),
                                        className: el.className,
                                        visible: rect.width > 0 && rect.height > 0,
                                        boundingBox: {
                                            x: rect.x,
                                            y: rect.y,
                                            width: rect.width,
                                            height: rect.height
                                        },
                                        // Find parent container
                                        parentTag: el.parentElement ? el.parentElement.tagName : null,
                                        parentClass: el.parentElement ? el.parentElement.className : null,
                                        parentId: el.parentElement ? el.parentElement.id : null
                                    });
                                });
                            } catch(e) {}
                        });
                        
                        // Also try to find a birthday container/wrapper
                        const containers = document.querySelectorAll('div, fieldset, section');
                        containers.forEach(container => {
                            const text = container.textContent || '';
                            const ariaLabel = container.getAttribute('aria-label') || '';
                            if (text.toLowerCase().includes('birthday') || 
                                ariaLabel.toLowerCase().includes('birthday') ||
                                container.querySelector('[aria-label*="Birthday"]') ||
                                container.querySelector('[aria-label*="birthday"]')) {
                                const rect = container.getBoundingClientRect();
                                elements.push({
                                    selector: 'birthday-container',
                                    tagName: container.tagName,
                                    role: container.getAttribute('role'),
                                    ariaLabel: ariaLabel,
                                    text: text.substring(0, 100),
                                    visible: rect.width > 0 && rect.height > 0,
                                    boundingBox: {
                                        x: rect.x,
                                        y: rect.y,
                                        width: rect.width,
                                        height: rect.height
                                    },
                                    className: container.className,
                                    id: container.id
                                });
                            }
                        });
                        
                        return elements;
                    }
                    """)
                    
                    for i, elem in enumerate(birthday_info):
                        #self.log(f"  [{i}] {elem.get('tagName', '?')} - role: {elem.get('role', '?')} - aria-label: {elem.get('ariaLabel', '?')} - visible: {elem.get('visible', False)}")
                        if elem.get('boundingBox'):
                            bb = elem['boundingBox']
                            #self.log(f"      Position: x={bb.get('x', 0)}, y={bb.get('y', 0)}, size: {bb.get('width', 0)}x{bb.get('height', 0)}")
                    
                    month_elem = None
                    day_elem = None
                    year_elem = None
                    container_elem = None
                    
                    for elem in birthday_info:
                        aria_label = elem.get('ariaLabel', '').lower()
                        if elem.get('selector') == 'birthday-container' and elem.get('visible'):
                            container_elem = elem
                        elif 'month' in aria_label and elem.get('visible'):
                            month_elem = elem
                        elif 'day' in aria_label and elem.get('visible'):
                            day_elem = elem
                        elif 'year' in aria_label and elem.get('visible'):
                            year_elem = elem
                    
                    birthday_elements = {
                        'container': container_elem,
                        'month': month_elem,
                        'day': day_elem,
                        'year': year_elem
                    }
                    
                    if container_elem:
                        #self.log(f"📍 Found birthday container, clicking at position: x={container_elem['boundingBox']['x']}, y={container_elem['boundingBox']['y']}")
                        await page.mouse.click(
                            container_elem['boundingBox']['x'] + container_elem['boundingBox']['width'] / 2,
                            container_elem['boundingBox']['y'] + container_elem['boundingBox']['height'] / 2
                        )
                        await asyncio.sleep(random.uniform(0.2, 0.4))
                    elif month_elem:
                        #self.log(f"📍 Found month field, clicking at position: x={month_elem['boundingBox']['x']}, y={month_elem['boundingBox']['y']}")
                        await page.mouse.click(
                            month_elem['boundingBox']['x'] + month_elem['boundingBox']['width'] / 2,
                            month_elem['boundingBox']['y'] + month_elem['boundingBox']['height'] / 2
                        )
                        await asyncio.sleep(random.uniform(0.2, 0.4))
                    else:
                        #self.log("⚠️ Could not find birthday container or month field, trying default approach...")
                        birthday_elements = None
                        
                except Exception as inspect_error:
                    #self.log(f"⚠️ Error inspecting birthday elements: {inspect_error}, using default approach...", "WARNING")
                    birthday_elements = None
                
                try:
                    async def human_type_text(text: str, min_delay: int = 80, max_delay: int = 150):
                        for char in text:
                            delay = random.randint(min_delay, max_delay)
                            await page.keyboard.type(char, delay=delay)
                            if random.random() < 0.1:  # 10% chance
                                await asyncio.sleep(random.uniform(0.05, 0.15))
                    
                    if birthday_elements and birthday_elements.get('month'):
                        month_elem = birthday_elements['month']
                        bb = month_elem['boundingBox']
                        #self.log(f"🖱️ Clicking month field using coordinates: x={bb['x'] + bb['width']/2}, y={bb['y'] + bb['height']/2}")
                        await page.mouse.click(bb['x'] + bb['width']/2, bb['y'] + bb['height']/2)
                    else:
                        month_spin = page.get_by_role('spinbutton', name='month, Birthday')
                        await month_spin.wait_for(state='visible', timeout=10000)
                        await asyncio.sleep(random.uniform(0.1, 0.3))
                        box = await month_spin.bounding_box()
                        if box:
                            await page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/2)
                        else:
                            await month_spin.click(button='left', force=False)
                    
                    await asyncio.sleep(random.uniform(0.15, 0.25))
                    
                    month_str = str(month_num)
                    await human_type_text(month_str)
                    
                    await asyncio.sleep(random.uniform(0.2, 0.4))
                    
                    if birthday_elements and birthday_elements.get('day'):
                        day_elem = birthday_elements['day']
                        bb = day_elem['boundingBox']
                        #self.log(f"🖱️ Clicking day field using coordinates: x={bb['x'] + bb['width']/2}, y={bb['y'] + bb['height']/2}")
                        await asyncio.sleep(random.uniform(0.15, 0.3))
                        await page.mouse.click(bb['x'] + bb['width']/2, bb['y'] + bb['height']/2)
                    else:
                        day_spin = page.get_by_role('spinbutton', name='day, Birthday')
                        await day_spin.wait_for(state='visible', timeout=10000)
                        await asyncio.sleep(random.uniform(0.15, 0.3))
                        box = await day_spin.bounding_box()
                        if box:
                            await page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/2)
                        else:
                            await day_spin.click(button='left', force=False)
                    await asyncio.sleep(random.uniform(0.15, 0.25))
                    
                    day_str = str(day_num)
                    await human_type_text(day_str)
                    await asyncio.sleep(random.uniform(0.2, 0.4))
                    
                    if birthday_elements and birthday_elements.get('year'):
                        year_elem = birthday_elements['year']
                        bb = year_elem['boundingBox']
                        #self.log(f"🖱️ Clicking year field using coordinates: x={bb['x'] + bb['width']/2}, y={bb['y'] + bb['height']/2}")
                        await asyncio.sleep(random.uniform(0.2, 0.35))
                        await page.mouse.click(bb['x'] + bb['width']/2, bb['y'] + bb['height']/2)
                    else:
                        year_spin = page.get_by_role('spinbutton', name='year, Birthday')
                        await year_spin.wait_for(state='visible', timeout=10000)
                        await asyncio.sleep(random.uniform(0.2, 0.35))
                        box = await year_spin.bounding_box()
                        if box:
                            await page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/2)
                        else:
                            await year_spin.click(button='left', force=False)
                    await asyncio.sleep(random.uniform(0.15, 0.25))
                    
                    year_str = str(year_num)
                    await human_type_text(year_str, min_delay=90, max_delay=160)
                    
                    await asyncio.sleep(random.uniform(0.3, 0.6))
                    
                    try:
                        values_check = await page.evaluate("""
                        () => {
                            const monthSpin = document.querySelector('[role="spinbutton"][aria-label*="month"]');
                            const daySpin = document.querySelector('[role="spinbutton"][aria-label*="day"]');
                            const yearSpin = document.querySelector('[role="spinbutton"][aria-label*="year"]');
                            
                            function getValue(element) {
                                if (!element) return '';
                                const input = element.querySelector('input');
                                if (input) return input.value || '';
                                return element.value || element.textContent || element.innerText || '';
                            }
                            
                            const errorElements = document.querySelectorAll('[role="alert"], .error, [aria-invalid="true"]');
                            const errors = Array.from(errorElements).map(el => el.textContent || '').filter(t => t.trim());
                            
                            return {
                                month: getValue(monthSpin),
                                day: getValue(daySpin),
                                year: getValue(yearSpin),
                                errors: errors
                            };
                        }
                        """)
                        
                            
                    except Exception as verify_error:
                        #self.log(f"⚠️ Error verifying birthday: {verify_error}", "WARNING")
                        pass
                    
                except Exception as keyboard_error:
                    #self.log(f"⚠️ Keyboard typing method failed: {keyboard_error}, trying JavaScript method...", "WARNING")
                    
                    try:
                        js_code = f"""
                    (() => {{
                        // Find spinbutton elements
                        const monthSpin = document.querySelector('[role="spinbutton"][aria-label*="month"]');
                        const daySpin = document.querySelector('[role="spinbutton"][aria-label*="day"]');
                        const yearSpin = document.querySelector('[role="spinbutton"][aria-label*="year"]');
                        
                        function setSpinbuttonValue(spinElement, value, isYear = false) {{
                            if (!spinElement) {{
                                console.log('Spinbutton element not found');
                                return false;
                            }}
                            
                            // Focus and click to activate
                            spinElement.focus();
                            spinElement.click();
                            
                            // For spinbuttons, they're usually contenteditable divs
                            // Clear the content first
                            if (spinElement.hasAttribute('contenteditable')) {{
                                // Clear existing content
                                spinElement.textContent = '';
                                spinElement.innerHTML = '';
                                
                                // Set the value as text
                                spinElement.textContent = String(value);
                                spinElement.innerText = String(value);
                                
                                // Set aria-valuenow if it exists
                                if (spinElement.hasAttribute('aria-valuenow')) {{
                                    spinElement.setAttribute('aria-valuenow', value);
                                }}
                                
                                // Trigger events
                                spinElement.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                spinElement.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                spinElement.dispatchEvent(new KeyboardEvent('keydown', {{ bubbles: true, key: 'Enter' }}));
                                spinElement.dispatchEvent(new KeyboardEvent('keyup', {{ bubbles: true, key: 'Enter' }}));
                                
                                // Blur to trigger validation
                                spinElement.blur();
                            }} else {{
                                // Try setting as value property
                                spinElement.value = value;
                                
                                // Try finding nested input
                                const input = spinElement.querySelector('input');
                                if (input) {{
                                    input.value = value;
                                    input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                    input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                    input.blur();
                                }}
                                
                                spinElement.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                spinElement.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                spinElement.blur();
                            }}
                            
                            return true;
                        }}
                        
                        // Set values - use numeric values (no zero-padding)
                        const monthOk = setSpinbuttonValue(monthSpin, {month_num});
                        const dayOk = setSpinbuttonValue(daySpin, {day_num});
                        const yearOk = setSpinbuttonValue(yearSpin, {year_num}, true);
                        
                        return {{ month: monthOk, day: dayOk, year: yearOk }};
                    }})();
                    """
                    
                        result = await page.evaluate(js_code)
                        await asyncio.sleep(1)  # Wait for any validation/updates
                        
                        try:
                            values_check = await page.evaluate("""
                        () => {
                            const monthSpin = document.querySelector('[role="spinbutton"][aria-label*="month"]');
                            const daySpin = document.querySelector('[role="spinbutton"][aria-label*="day"]');
                            const yearSpin = document.querySelector('[role="spinbutton"][aria-label*="year"]');
                            
                            function getValue(element) {
                                if (!element) return '';
                                // Try multiple ways to get the value
                                const input = element.querySelector('input');
                                if (input) return input.value || '';
                                return element.value || element.textContent || element.innerText || '';
                            }
                            
                            // Check for error messages
                            const errorElements = document.querySelectorAll('[role="alert"], .error, [aria-invalid="true"]');
                            const errors = Array.from(errorElements).map(el => el.textContent || '').filter(t => t.trim());
                            
                            return {
                                month: getValue(monthSpin),
                                day: getValue(daySpin),
                                year: getValue(yearSpin),
                                errors: errors
                            };
                        }
                        """)
                            
                            #self.log(f"🔍 Birthday values set: month={values_check['month']}, day={values_check['day']}, year={values_check['year']}")
                            
                            if values_check.get('errors') and len(values_check['errors']) > 0:
                                #self.log(f"⚠️ Birthday errors detected: {values_check['errors']}", "WARNING")
                                
                                if not values_check['month'] or not values_check['day'] or values_check['errors']:
                                    #self.log("🔄 Retrying with zero-padded format (MM/DD)...")
                                    month_str = f"{birthday['month']:02d}"
                                    day_str = f"{birthday['day']:02d}"
                                    
                                    retry_js = f"""
                                    (() => {{
                                        const monthSpin = document.querySelector('[role="spinbutton"][aria-label*="month"]');
                                        const daySpin = document.querySelector('[role="spinbutton"][aria-label*="day"]');
                                        
                                        if (monthSpin && monthSpin.hasAttribute('contenteditable')) {{
                                            monthSpin.textContent = '{month_str}';
                                            monthSpin.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                            monthSpin.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                        }}
                                        if (daySpin && daySpin.hasAttribute('contenteditable')) {{
                                            daySpin.textContent = '{day_str}';
                                            daySpin.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                            daySpin.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                        }}
                                        return true;
                                    }})();
                                    """
                                    await page.evaluate(retry_js)
                                    await asyncio.sleep(1)
                            
                        except Exception as e:
                            #self.log(f"⚠️ Error verifying birthday values: {e}", "WARNING")
                            pass
                        
                        await asyncio.sleep(1)
                        
                    except Exception as js_error:
                        #self.log(f"❌ JavaScript fallback method also failed: {js_error}", "ERROR")
                        return False
                    
                except Exception as e:
                    #self.log(f"❌ Error setting birthday: {e}", "ERROR")
                    return False
                
                #self.log("🔘 Clicking Continue to complete signup...")
                try:
                    continue_button = page.get_by_role('button', name='Continue')
                    await continue_button.wait_for(state='visible', timeout=10000)
                    
                    is_enabled = await continue_button.is_enabled()
                    if not is_enabled:
                        #self.log("⏳ Continue button not enabled yet, waiting for validation...")
                        await asyncio.sleep(2)
                        is_enabled = await continue_button.is_enabled()
                        if not is_enabled:
                            #self.log("⚠️ Continue button still not enabled, attempting click anyway...", "WARNING")
                            pass
                    
                    async with page.expect_navigation(wait_until='domcontentloaded', timeout=20000) as navigation_info:
                        await continue_button.click(timeout=10000)
                    
                    await asyncio.sleep(2)
                except Exception as e:
                    #self.log(f"❌ Error clicking Continue: {e}", "ERROR")
                    return False
                
                try:
                    current_url = page.url
                    if 'chatgpt.com' in current_url:
                        self.log(f"✅ Account created successfully!")
                        self.save_account(email, password)
                        await context.close()
                        return True
                    else:
                        self.log(f"⚠️ Unexpected Error after signup", "WARNING")
                        self.save_account(email, password)
                        await context.close()
                        return True
                except Exception as e:
                    self.log(f"⚠️ Error verifying account creation", "WARNING")
                    self.save_account(email, password)
                    await context.close()
                    return True
                
        except Exception as e:
            #self.log(f"💥 Critical error creating account: {str(e)}", "CRITICAL")
            return False
            
        finally:
            try:
                await asyncio.sleep(1)
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    #self.log(f"🗑️ Cleaned up temp directory for account {account_number}")
            except Exception as e:
                #self.log(f"⚠️ Could not clean up temp directory: {e}")
                pass
    
    async def create_accounts(self, num_accounts: int):
        self.log(f"🚀 Starting account creation for {num_accounts} accounts...")
        self.log(f"⚙️ Max concurrent workers: {self.max_workers}")
        
        successful = 0
        failed = 0
        
        semaphore = asyncio.Semaphore(self.max_workers)
        
        async def create_account_with_semaphore(account_num: int):
            nonlocal successful, failed
            async with semaphore:
                try:
                    self.log(f"🔄 Worker starting account {account_num}/{num_accounts}")
                    success = await self.create_account(account_num, num_accounts)
                    if success:
                        successful += 1
                        self.log(f"✅ Account {account_num} completed successfully")
                    else:
                        failed += 1
                        self.log(f"❌ Account {account_num} failed")
                    
                    delay = random.uniform(1, 3)
                    await asyncio.sleep(delay)
                    
                except Exception as e:
                    self.log(f"💥 Error creating account {account_num}: {e}", "ERROR")
                    failed += 1
        
        tasks = [create_account_with_semaphore(i) for i in range(1, num_accounts + 1)]
        
        await asyncio.gather(*tasks, return_exceptions=True)
        
        self.print_summary(successful, failed)
    
    def print_summary(self, successful: int, failed: int):
        print("\n" + "=" * 60)
        print("📊 ACCOUNT CREATION SUMMARY")
        print("=" * 60)
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"📝 Total accounts saved: {len(self.created_accounts)}")
        print(f"💾 Accounts saved to: {self.accounts_file}")
        
        if self.created_accounts:
            print("\n✅ CREATED ACCOUNTS:")
            for i, account in enumerate(self.created_accounts, 1):
                print(f"  {i}. {account['email']}")
        
        print("=" * 60)


async def main():
    print("🤖 ChatGPT Account Creator")
    print("=" * 60)
    print("✅ Concurrent account creation enabled")
    
    creator = ChatGPTAccountCreator()
    
    print(f"⚙️ Configuration loaded:")
    print(f"   - Max concurrent workers: {creator.max_workers}")
    print(f"   - Headless mode: {creator.config.get('headless', True)}")
    password = creator.config.get('password')
    if password:
        print(f"   - Password: {'*' * min(len(password), 20)} (from config.json)")
    else:
        print(f"   - Password: ❌ NOT SET (please add 'password' to config.json)")
    print()
    
    try:
        num_accounts = int(input("\n📝 How many accounts do you want to create? "))
        if num_accounts <= 0:
            print("❌ Please enter a positive number!")
            return
        
        print(f"\n🚀 Starting creation of {num_accounts} account(s)...")
        print(f"   Each account will have its own fresh browser instance")
        print(f"   Running up to {creator.max_workers} accounts concurrently\n")
        await creator.create_accounts(num_accounts)
        
    except ValueError:
        print("❌ Invalid input! Please enter a number.")
    except KeyboardInterrupt:
        print("\n\n🛑 Script interrupted by user (Ctrl+C)")
        print("✅ Progress saved to accounts.txt")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())

