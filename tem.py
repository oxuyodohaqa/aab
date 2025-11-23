import imaplib
import email
import re
import time
import uuid
import cloudscraper
from typing import Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import random

class ChatGPTSignupTripleMethod:
    """
    ChatGPT Auto Signup - TRIPLE METHOD VERSION
    Choose between:
    1. 🏪 Alfashop Tmail API (12 custom domains)
    2. 🌐 Temp-Mail.io API (13 temp-mail domains)
    3. 📧 Gmail IMAP (custom domain + Gmail)
    By: Adeebaabkhan
    Updated: 2025-11-13 09:20:00 UTC
    """
    
    # Alfashop custom domains
    ALFASHOP_DOMAINS = [
        'tokoalfaya.my.id',
        'kakalfaa.my.id',
        'alfapremium.biz.id',
        'alfaganteng.biz.id',
        'alfaapril.web.id',
        'alfasatru.web.id',
        'alfajajanpremium.biz.id',
        'alfalagikeluar.biz.id',
        'alfasukadagang.my.id',
        'alfasukangopi.biz.id',
        'premiumwithalfa.my.id',
        'alfakalcer.biz.id'
    ]
    
    # Temp-mail.io domains
    TEMP_MAIL_DOMAINS = [
        'jxpomup.com', 'ibolinva.com', 'wyoxafp.com', 'jkotypc.com',
        'cmhvzylmfc.com', 'daouse.com', 'illubd.com', 'mkzaso.com',
        'mrotzis.com', 'xkxkud.com', 'wnbaldwy.com', 'bwmyga.com', 'ozsaip.com'
    ]
    
    def __init__(self, gmail_user: str, gmail_password: str, alfashop_api_key: str = None,
                 thread_id: int = 0, method: str = 'alfashop'):
        self.auth_url = "https://auth.openai.com"
        self.chatgpt_url = "https://chatgpt.com"
        
        # Gmail credentials
        self.gmail_user = gmail_user
        self.gmail_password = gmail_password.replace(' ', '').strip()
        
        # Alfashop API
        self.alfashop_api_key = alfashop_api_key or "K3UyGiVOrN6aSvP9RXZ0"
        self.alfashop_base_url = "https://alfashop.ragn.web.id/api"
        
        # Thread ID
        self.thread_id = thread_id
        
        # Method selection: 'alfashop', 'tempmail', or 'imap'
        self.method = method
        
        # Create session
        self.session = cloudscraper.create_scraper(
            browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True}
        )
        
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        })
        
        self.client_id = "app_X8zY6vW2pQ9tR3dE7nK1jL5gH"
        self.device_id = str(uuid.uuid4())
        self.auth_session_logging_id = str(uuid.uuid4())
        
        self.email = None
        self.password = None
        self.temp_mail_token = None
        
        # Lock
        self.lock = threading.Lock()
    
    def log(self, message: str):
        """Thread-safe logging"""
        timestamp = time.strftime("%H:%M:%S")
        method_icons = {
            'alfashop': '🏪',
            'tempmail': '🌐',
            'imap': '📧'
        }
        icon = method_icons.get(self.method, '❓')
        print(f"[{timestamp}] [{icon} T-{self.thread_id:03d}] {message}", flush=True)
    
    def generate_clean_username(self) -> str:
        """Generate clean username"""
        try:
            from faker import Faker
            fake = Faker()
            first_name = re.sub(r'[^a-z]', '', fake.first_name().lower())
            last_name = re.sub(r'[^a-z]', '', fake.last_name().lower())
        except ImportError:
            first_names = ['james', 'mary', 'john', 'patricia', 'robert', 'jennifer']
            last_names = ['smith', 'johnson', 'williams', 'brown', 'jones']
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
        
        formats = [
            f"{first_name}{last_name}",
            f"{first_name}.{last_name}",
            f"{first_name}_{last_name}",
            first_name,
        ]
        return random.choice(formats)
    
    def generate_random_name(self) -> str:
        """Generate random first name for account"""
        try:
            from faker import Faker
            fake = Faker()
            return fake.first_name()
        except ImportError:
            names = [
                'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer',
                'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara',
                'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah',
                'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
                'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
                'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily',
                'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Carol',
                'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
                'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca'
            ]
            return random.choice(names)
    
    # ==================== METHOD 1: ALFASHOP TMAIL ====================
    
    def generate_alfashop_email(self) -> Optional[str]:
        """
        🏪 METHOD 1: Generate email using Alfashop Tmail API
        Returns: email address
        """
        try:
            domain = random.choice(self.ALFASHOP_DOMAINS)
            
            url = f'{self.alfashop_base_url}/email/create/{self.alfashop_api_key}'
            
            response = self.session.get(
                url,
                params={'domain': domain},
                timeout=10
            )
            
            if response.ok:
                email_address = response.text.strip()
                
                if '@' in email_address and '.' in email_address:
                    self.log(f"✅ Email: {email_address}")
                    return email_address
                else:
                    self.log(f"⚠️  Invalid: {email_address}")
                    return None
            else:
                self.log(f"❌ API failed: {response.status_code}")
                return None
            
        except Exception as e:
            self.log(f"❌ Error: {e}")
            return None
    
    def extract_otp_from_html(self, html_content: str) -> Optional[str]:
        """Extract OTP from HTML email"""
        if not html_content:
            return None
        
        # Method 1: Large font paragraph
        match = re.search(r'<p[^>]*font-size:\s*24px[^>]*>[\s\n]*(\d{6})[\s\n]*</p>', html_content, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Method 2: "Your ChatGPT code is XXXXXX"
        match = re.search(r'Your ChatGPT code is (\d{6})', html_content, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Method 3: Title tag
        match = re.search(r'<title>.*?(\d{6}).*?</title>', html_content, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Method 4: Generic patterns
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
    
    def get_otp_from_alfashop(self, email_address: str, max_wait: int = 120) -> Optional[str]:
        """
        🏪 METHOD 1: Get OTP from Alfashop Tmail API
        """
        self.log(f"⏳ Checking Alfashop (max {max_wait}s)...")
        start_time = time.time()
        check_count = 0
        
        endpoint_patterns = [
            f'email/{email_address}/messages/{self.alfashop_api_key}',
            f'messages/{email_address}/{self.alfashop_api_key}',
            f'inbox/{email_address}/{self.alfashop_api_key}',
            f'mail/{email_address}/{self.alfashop_api_key}',
        ]
        
        while (time.time() - start_time) < max_wait:
            try:
                check_count += 1
                
                for endpoint in endpoint_patterns:
                    try:
                        url = f'{self.alfashop_base_url}/{endpoint}'
                        response = self.session.get(url, timeout=10)
                        
                        if response.ok:
                            content = response.text.strip()
                            
                            if not content or len(content) < 20:
                                continue
                            
                            try:
                                import json
                                data = json.loads(content)
                                
                                messages = None
                                if isinstance(data, list) and len(data) > 0:
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
                                        self.log(f"🔑 OTP: {otp} ({elapsed:.1f}s)")
                                        return otp
                            
                            except json.JSONDecodeError:
                                otp = self.extract_otp_from_html(content)
                                if otp:
                                    elapsed = time.time() - start_time
                                    self.log(f"🔑 OTP: {otp} ({elapsed:.1f}s)")
                                    return otp
                    
                    except:
                        continue
                
                if check_count % 10 == 0:
                    elapsed = time.time() - start_time
                    self.log(f"⏳ Waiting... ({elapsed:.0f}s)")
                
            except:
                pass
            
            time.sleep(3)
        
        self.log(f"❌ Timeout ({max_wait}s)")
        return None
    
    # ==================== METHOD 2: TEMP-MAIL.IO ====================
    
    def generate_tempmail_email(self) -> Tuple[str, Optional[str]]:
        """🌐 METHOD 2: Generate email using Temp-Mail.io API"""
        try:
            domain = random.choice(self.TEMP_MAIL_DOMAINS)
            username = self.generate_clean_username()
            
            response = self.session.post(
                'https://api.internal.temp-mail.io/api/v3/email/new',
                headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
                json={'name': username, 'domain': domain},
                timeout=10
            )
            
            if response.ok:
                data = response.json()
                if data.get('email') and data.get('token'):
                    self.log(f"✅ Temp-Mail: {data['email']}")
                    return data['email'], data['token']
            
            email_address = f"{username}{random.randint(100,999)}@{domain}"
            self.log(f"⚠️  Temp-Mail (no token): {email_address}")
            return email_address, None
            
        except Exception as e:
            domain = random.choice(self.TEMP_MAIL_DOMAINS)
            username = self.generate_clean_username()
            email_address = f"{username}{random.randint(100,999)}@{domain}"
            self.log(f"⚠️  Error: {email_address}")
            return email_address, None
    
    def get_otp_from_tempmail(self, email_address: str, token: Optional[str], max_wait: int = 120) -> Optional[str]:
        """🌐 METHOD 2: Get OTP from Temp-Mail.io API"""
        if not token:
            self.log("❌ No token")
            return None
        
        self.log(f"⏳ Checking Temp-Mail (max {max_wait}s)...")
        start_time = time.time()
        check_count = 0
        
        while (time.time() - start_time) < max_wait:
            try:
                check_count += 1
                
                response = self.session.get(
                    f'https://api.internal.temp-mail.io/api/v3/email/{email_address}/messages',
                    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'},
                    timeout=10
                )
                
                if response.ok:
                    messages = response.json()
                    
                    if messages and len(messages) > 0:
                        message = messages[0]
                        message_body = message.get('body_text', '') + message.get('body_html', '')
                        
                        patterns = [
                            r'verification code[:\s]*(\d{4,8})',
                            r'code[:\s]*(\d{4,8})',
                            r'(\d{6})',
                            r'(\d{4,8})'
                        ]
                        
                        for pattern in patterns:
                            match = re.search(pattern, message_body, re.IGNORECASE)
                            if match:
                                otp = match.group(1)
                                elapsed = time.time() - start_time
                                self.log(f"🔑 OTP: {otp} ({elapsed:.1f}s)")
                                return otp
                
            except:
                pass
            
            time.sleep(3)
        
        self.log(f"❌ Timeout ({max_wait}s)")
        return None
    
    # ==================== METHOD 3: GMAIL IMAP ====================
    
    def generate_imap_email(self, domain: Optional[str], use_gmail_plus: bool = False) -> str:
        """📧 METHOD 3: Generate email with custom domain or Gmail "+" alias"""
        if use_gmail_plus:
            local_part, _, base_domain = self.gmail_user.partition('@')
            base_domain = base_domain or 'gmail.com'

            tag = f"+{self.generate_clean_username()}{random.randint(1000, 9999)}"
            email_address = f"{local_part}{tag}@{base_domain}"
            self.log(f"✅ Gmail (+): {email_address}")
            return email_address.lower()

        try:
            from faker import Faker
            fake = Faker()
            name = fake.first_name()
        except:
            names = ['james', 'mary', 'john', 'patricia', 'robert']
            name = random.choice(names)

        suffix = random.randint(1000, 9999)
        email_address = f"{name}{suffix}@{domain}"
        self.log(f"✅ Gmail: {email_address}")
        return email_address.lower()
    
    def get_otp_from_imap(self, target_email: str, max_wait: int = 120) -> Optional[str]:
        """📧 METHOD 3: Get OTP from Gmail IMAP"""
        self.log(f"⏳ Checking IMAP (max {max_wait}s)...")
        start_time = time.time()
        check_count = 0

        while (time.time() - start_time) < max_wait:
            try:
                if check_count > 0:
                    time.sleep(2)

                check_count += 1

                mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
                mail.login(self.gmail_user, self.gmail_password)
                
                folders = ['INBOX', '[Gmail]/Spam', '[Gmail]/All Mail']
                
                for folder in folders:
                    try:
                        mail.select(f'"{folder}"', readonly=True)
                        _, message_numbers = mail.search(None, '(FROM "noreply@tm.openai.com")')
                        
                        if not message_numbers[0]:
                            continue

                        email_ids = message_numbers[0].split()

                        for email_id in reversed(email_ids[-15:]):
                            try:
                                _, msg_data = mail.fetch(email_id, "(RFC822)")
                                email_body = msg_data[0][1]
                                email_message = email.message_from_bytes(email_body)

                                headers_to_check = [
                                    email_message.get('To', ''),
                                    email_message.get('Delivered-To', ''),
                                    email_message.get('X-Original-To', '')
                                ]
                                headers_to_check = [h.lower() for h in headers_to_check if h]

                                if any(target_email.lower() in h for h in headers_to_check):
                                    body = ""
                                    if email_message.is_multipart():
                                        for part in email_message.walk():
                                            if part.get_content_type() in ["text/plain", "text/html"]:
                                                try:
                                                    body += part.get_payload(decode=True).decode(errors='ignore')
                                                except:
                                                    pass
                                    else:
                                        try:
                                            body = email_message.get_payload(decode=True).decode(errors='ignore')
                                        except:
                                            pass

                                    match = re.search(r'\b(\d{6})\b', body)
                                    if match:
                                        otp = match.group(1)
                                        elapsed = time.time() - start_time
                                        self.log(f"🔑 OTP: {otp} ({elapsed:.1f}s)")
                                        mail.logout()
                                        return otp

                            except:
                                continue
                    except:
                        continue

                mail.logout()
                
            except:
                pass
        
        self.log(f"❌ Timeout ({max_wait}s)")
        return None
    
    # ==================== COMMON CHATGPT METHODS ====================
    
    def start_oauth_flow(self, email: str) -> bool:
        """Start OAuth flow"""
        try:
            self.session.get(self.chatgpt_url, timeout=30)
            time.sleep(0.5)
            
            state = str(uuid.uuid4())
            
            params = {
                'client_id': self.client_id,
                'scope': 'openid email profile offline_access model.request model.read organization.read organization.write',
                'response_type': 'code',
                'redirect_uri': f'{self.chatgpt_url}/api/auth/callback/openai',
                'audience': 'https://api.openai.com/v1',
                'device_id': self.device_id,
                'prompt': 'login',
                'ext-oai-did': self.device_id,
                'auth_session_logging_id': self.auth_session_logging_id,
                'screen_hint': 'login_or_signup',
                'login_hint': email,
                'state': state
            }
            
            url = f"{self.auth_url}/api/accounts/authorize"
            
            headers = self.session.headers.copy()
            headers.update({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://chatgpt.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-User': '?1',
            })
            
            response = self.session.get(url, params=params, headers=headers, allow_redirects=True, timeout=30)
            
            if response.status_code == 200:
                self.log("✅ OAuth started")
                return True
            
            self.log(f"❌ OAuth failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"❌ OAuth error: {e}")
            return False
    
    def register_user(self, email: str, password: str) -> bool:
        """Register user"""
        url = f"{self.auth_url}/api/accounts/user/register"
        
        headers = self.session.headers.copy()
        headers.update({
            'accept': 'application/json',
            'content-type': 'application/json',
            'Origin': 'https://auth.openai.com',
            'Referer': 'https://auth.openai.com/create-account/password',
            'openai-sentinel-token': '{}',
        })
        
        payload = {"username": email, "password": password}
        
        try:
            response = self.session.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                self.log("✅ Registered")
                return True
            
            self.log(f"❌ Registration failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"❌ Register error: {e}")
            return False
    
    def send_otp(self) -> bool:
        """Send OTP"""
        url = f"{self.auth_url}/api/accounts/email-otp/send"
        
        headers = self.session.headers.copy()
        headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://auth.openai.com/create-account/password',
        })
        
        try:
            response = self.session.get(url, headers=headers, allow_redirects=True, timeout=30)
            
            if response.status_code in [200, 302]:
                self.log("✅ OTP sent")
                return True
            
            self.log(f"❌ OTP send failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"❌ OTP error: {e}")
            return False
    
    def validate_otp(self, code: str) -> bool:
        """Validate OTP"""
        url = f"{self.auth_url}/api/accounts/email-otp/validate"
        
        headers = self.session.headers.copy()
        headers.update({
            'accept': 'application/json',
            'content-type': 'application/json',
            'Origin': 'https://auth.openai.com',
            'Referer': 'https://auth.openai.com/email-verification',
        })
        
        payload = {"code": code}
        
        try:
            response = self.session.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                self.log("✅ OTP validated")
                return True
            
            self.log(f"❌ Validation failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"❌ Validate error: {e}")
            return False
    
    def create_account(self, name: str, birthdate: str) -> bool:
        """Complete account creation"""
        url = f"{self.auth_url}/api/accounts/create_account"
        
        headers = self.session.headers.copy()
        headers.update({
            'accept': 'application/json',
            'content-type': 'application/json',
            'Origin': 'https://auth.openai.com',
            'Referer': 'https://auth.openai.com/about-you',
            'openai-sentinel-token': '{}'
        })
        
        payload = {"name": name, "birthdate": birthdate}
        
        try:
            response = self.session.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                self.log("✅ Account created!")
                return True
            
            self.log(f"❌ Creation failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"❌ Create error: {e}")
            return False
    
    def save_account(self, filename='chatgpt_accounts_triple.txt'):
        """Save account (thread-safe)"""
        with self.lock:
            with open(filename, 'a', encoding='utf-8') as f:
                f.write(f"{self.email}:{self.password}\n")
        self.log(f"💾 Saved")
    
    def create_account_auto(self, email: str, password: str, name: str, birthdate: str = "2002-05-30") -> bool:
        """Automated account creation"""
        self.email = email
        self.password = password
        
        try:
            # OAuth
            self.log(f"🚀 {name} | {email}")
            if not self.start_oauth_flow(email):
                return False
            time.sleep(0.5)
            
            # Register
            if not self.register_user(email, password):
                return False
            time.sleep(0.5)
            
            # Send OTP
            if not self.send_otp():
                return False
            
            # Get OTP
            if self.method == 'alfashop':
                code = self.get_otp_from_alfashop(email, max_wait=120)
            elif self.method == 'tempmail':
                code = self.get_otp_from_tempmail(email, self.temp_mail_token, max_wait=120)
            else:
                code = self.get_otp_from_imap(email, max_wait=120)
            
            if not code:
                return False
            
            # Validate OTP
            if not self.validate_otp(code):
                return False
            time.sleep(0.5)
            
            # Complete
            if not self.create_account(name, birthdate):
                return False
            
            self.log(f"🎉 SUCCESS: {name} | {email}:{password}")
            self.save_account()
            
            return True
            
        except Exception as e:
            self.log(f"❌ Exception: {e}")
            return False


def create_single_account(args):
    """Worker function"""
    thread_id, gmail_user, gmail_password, alfashop_api_key, method, domain, use_gmail_plus, password = args
    
    try:
        bot = ChatGPTSignupTripleMethod(
            gmail_user=gmail_user,
            gmail_password=gmail_password,
            alfashop_api_key=alfashop_api_key,
            thread_id=thread_id,
            method=method
        )
        
        # Generate unique name for each account
        name = bot.generate_random_name()
        
        # Generate email based on method
        if method == 'alfashop':
            email_address = bot.generate_alfashop_email()
            if not email_address:
                return {'success': False, 'error': 'Failed to generate email', 'name': name}
        elif method == 'tempmail':
            email_address, token = bot.generate_tempmail_email()
            bot.temp_mail_token = token
        else:
            email_address = bot.generate_imap_email(domain, use_gmail_plus=use_gmail_plus)
        
        # Create account
        success = bot.create_account_auto(
            email=email_address,
            password=password,
            name=name,
            birthdate="2002-05-30"
        )
        
        return {
            'success': success,
            'email': email_address,
            'password': password,
            'method': method,
            'name': name
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_user_input():
    """Get configuration"""
    print("="*80)
    print("🚀 ChatGPT Auto Signup - TRIPLE METHOD VERSION")
    print("   1. 🏪 Alfashop Tmail (12 domains, default: alfashop1234)")
    print("   2. 🌐 Temp-Mail.io (13 domains, default: Meow@1234567)")
    print("   3. 📧 Gmail IMAP (needs setup, default: Meow@1234567)")
    print("   By: Adeebaabkhan | Updated: 2025-11-13 09:20:00 UTC")
    print("="*80)
    
    # Method selection
    print("\n📊 SELECT METHOD:")
    method_choice = input("Enter method [1=Alfashop, 2=Temp-Mail, 3=IMAP] (default 1): ").strip()
    
    use_gmail_plus = False

    if method_choice == '2':
        method = 'tempmail'
        domain = None
        print("✅ Selected: Temp-Mail.io")
    elif method_choice == '3':
        method = 'imap'
        print("\n🌐 IMAP modes:")
        print("   [1] Custom domain (default)")
        print("   [2] Gmail '+' alias (faster, no domain needed)")
        mode_choice = input("Choose IMAP mode (1-2, default 1): ").strip()

        if mode_choice == '2':
            use_gmail_plus = True
            domain = None
            print("✅ Selected: Gmail IMAP with '+' alias")
        else:
            print("\n🌐 Available domains:")
            domains = ['dressrosa.me', 'puella.shop', 'wemel.top']
            for i, d in enumerate(domains, 1):
                print(f"   [{i}] {d}")

            domain_choice = int(input("\nSelect domain (1-3, default 1): ").strip() or '1')
            domain = domains[domain_choice - 1]
            print(f"✅ Selected: Gmail IMAP + {domain}")
    else:
        method = 'alfashop'
        domain = None
        print("✅ Selected: Alfashop Tmail")
    
    # Number of accounts
    while True:
        try:
            num_accounts = int(input("\n📊 How many accounts (default 10): ").strip() or "10")
            if num_accounts > 0:
                break
            print("❌ Enter positive number")
        except ValueError:
            print("❌ Enter valid number")
    
    # Threads (default 10, no question)
    max_workers = 10
    
    # Password with default based on method
    if method == 'alfashop':
        default_pass = "alfashop1234"
    else:
        default_pass = "Meow@1234567"
    
    password = input(f"\n🔒 Password (default '{default_pass}'): ").strip()
    if not password:
        password = default_pass
    
    return num_accounts, max_workers, method, domain, use_gmail_plus, password


def main():
    """Main function"""
    # Credentials
    GMAIL_USER = 'aabkhan402@gmail.com'
    GMAIL_APP_PASSWORD = 'ftljxjidduzsqxob'
    ALFASHOP_API_KEY = 'K3UyGiVOrN6aSvP9RXZ0'
    
    # Get config
    num_accounts, max_workers, method, domain, use_gmail_plus, password = get_user_input()
    
    print(f"\n🎯 Configuration:")
    print(f"   Method: {method.upper()}")
    print(f"   Accounts: {num_accounts}")
    print(f"   Threads: {max_workers}")
    if method == 'imap':
        if use_gmail_plus:
            print(f"   Mode: Gmail '+' alias")
        else:
            print(f"   Domain: {domain}")
    elif method == 'alfashop':
        print(f"   Domains: {len(ChatGPTSignupTripleMethod.ALFASHOP_DOMAINS)} Alfashop domains")
    else:
        print(f"   Domains: {len(ChatGPTSignupTripleMethod.TEMP_MAIL_DOMAINS)} Temp-mail domains")
    print(f"   Password: {password}")
    print(f"   Names: Auto-generated (different for each)")
    print("="*80)
    
    input("\nPress Enter to start...")
    
    # Prepare tasks
    tasks = []
    for i in range(num_accounts):
        tasks.append((
            i + 1,
            GMAIL_USER,
            GMAIL_APP_PASSWORD,
            ALFASHOP_API_KEY,
            method,
            domain,
            use_gmail_plus,
            password
        ))
    
    # Start processing
    print(f"\n🚀 Starting creation...")
    print(f"⏰ Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")
    
    start_time = time.time()
    successful = 0
    failed = 0
    results = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_task = {executor.submit(create_single_account, task): task for task in tasks}
        
        for future in as_completed(future_to_task):
            try:
                result = future.result()
                results.append(result)
                
                if result['success']:
                    successful += 1
                else:
                    failed += 1
                
                total_done = successful + failed
                print(f"\n{'='*80}")
                print(f"📊 Progress: {total_done}/{num_accounts} | ✅ {successful} | ❌ {failed}")
                print(f"{'='*80}\n")
                
            except Exception as e:
                failed += 1
                print(f"\n❌ Task error: {e}\n")
    
    elapsed = time.time() - start_time
    
    # Summary
    print("\n" + "="*80)
    print("🎉 FINAL SUMMARY")
    print("="*80)
    print(f"✅ Successful: {successful}/{num_accounts} ({successful/num_accounts*100:.1f}%)")
    print(f"❌ Failed: {failed}/{num_accounts}")
    print(f"⏱️  Total Time: {elapsed:.1f}s ({elapsed/60:.1f}min)")
    print(f"⚡ Avg: {elapsed/num_accounts:.1f}s per account")
    print(f"📁 Saved to: chatgpt_accounts_triple.txt")
    print("="*80)
    
    # Show accounts
    if successful > 0:
        print("\n✅ Successfully Created:")
        print("-" * 80)
        for result in results:
            if result['success']:
                method_icons = {'alfashop': '🏪', 'tempmail': '🌐', 'imap': '📧'}
                icon = method_icons.get(result['method'], '❓')
                name = result.get('name', 'User')
                print(f"   {icon} {name:12} | {result['email']}:{result['password']}")
        print("-" * 80)
    
    input("\nPress Enter to exit...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled")
        input("Press Enter to exit...")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")