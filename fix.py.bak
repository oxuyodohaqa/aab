
#!/usr/bin/env python3
"""
TELEGRAM BOT - 200+ COUNTRIES - WITH MEMORY & TAP-TO-COPY
Configuration, Imports, Colors, Countries Dictionary
Author: Adeebaabkhan
Date: 2025-10-22 08:38:21 UTC
"""
import imaplib
import math
import os
import logging
import json
import random
import re
import requests
import time
from email import message_from_bytes
from email.utils import parsedate_to_datetime
from io import BytesIO
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw, ImageFont
import qrcode
from faker import Faker
import sqlite3
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Updater,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    Filters,
    ConversationHandler,
    CallbackContext,
)

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

retry_strategy = Retry(
    total=3,
    status_forcelist=[429, 500, 502, 503, 504],
    backoff_factor=0.5,
    allowed_methods=["GET"],
)
http = requests.Session()
http.mount("https://", HTTPAdapter(max_retries=retry_strategy))
http.mount("http://", HTTPAdapter(max_retries=retry_strategy))

DOC_BOT_TOKEN = os.getenv("BOT_TOKEN", "8233094350:AAEiVBsJ2RtLjlDfQ45ef1wCmRTwWtyNwMk")
AIRWALLEX_BOT_TOKEN = os.getenv("AIRWALLEX_BOT_TOKEN", "8292127678:AAGDhFHjZpEld0nyzJKKa2HkG7zZ-ch_t0g")
SUPER_ADMIN_ID = 7680006005
ADMIN_IDS = {SUPER_ADMIN_ID}
extra_admins = os.getenv("ADMIN_IDS", "").split(",") if os.getenv("ADMIN_IDS") else []
for admin_id in extra_admins:
    try:
        ADMIN_IDS.add(int(admin_id.strip()))
    except ValueError:
        logger.warning(f"Skipping invalid admin id in ADMIN_IDS env: {admin_id}")

# COLORS
DARK_GRAY = (58, 74, 92)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GOLD = (255, 215, 0)
GREEN = (46, 204, 113)
RED = (220, 52, 69)
BORDER_GRAY = (200, 200, 200)
BLUE = (25, 118, 210)
NAVY_BLUE = (34, 62, 96)
LIGHT_GRAY = (240, 240, 240)

LOGO_PATH = os.getenv("LOGO_PATH", "assets/logo.png")
GMAIL_USER = os.getenv("GMAIL_USER", "aabkhan402@gmail.com")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "ftljxjidduzsqxob")
AIRWALLEX_SENDER = "support@info.airwallex.com"

# PROFESSIONS - 47 OPTIONS
TEACHER_PROFESSIONS = [
    'Head Teacher', 'Senior Teacher', 'Department Head', 'Teacher', 'Mathematics Teacher',
    'Science Teacher', 'English Teacher', 'Physics Teacher', 'Chemistry Teacher', 'Biology Teacher',
    'History Teacher', 'Geography Teacher', 'Economics Teacher', 'Political Science Teacher',
    'Sociology Teacher', 'Philosophy Teacher', 'Hindi Teacher', 'Sanskrit Teacher', 'French Teacher',
    'Spanish Teacher', 'German Teacher', 'Computer Science Teacher', 'Information Technology Teacher',
    'Engineering Teacher', 'Electronics Teacher', 'Mechanical Technology Teacher', 'Civil Technology Teacher',
    'AutoCAD Instructor', 'Coding Instructor', 'Art Teacher', 'Music Teacher', 'Dance Instructor',
    'Drama Teacher', 'Physical Education Teacher', 'Sports Coach', 'Special Education Teacher',
    'Speech Therapist', 'Counselor', 'Learning Support Teacher', 'Commerce Teacher', 'Accounting Teacher',
    'Business Studies Teacher', 'Law Instructor', 'Medical Science Teacher', 'Librarian',
    'Laboratory Technician', 'Senior Lecturer'
]

# 100 COUNTRIES BASE
COUNTRIES = {
    'US': {'name': 'United States', 'flag': '🇺🇸', 'locale': 'en_US', 'symbol': '$', 'salary': (35000, 120000), 'json': 'sheerid_us.json'},
    'IN': {'name': 'India', 'flag': '🇮🇳', 'locale': 'en_US', 'symbol': '₹', 'salary': (300000, 2000000), 'json': 'sheerid_in.json'},
    'GB': {'name': 'United Kingdom', 'flag': '🇬🇧', 'locale': 'en_US', 'symbol': '£', 'salary': (28000, 95000), 'json': 'sheerid_gb.json'},
    'AE': {'name': 'UAE', 'flag': '🇦🇪', 'locale': 'en_US', 'symbol': 'د.إ', 'salary': (80000, 350000), 'json': 'sheerid_ae.json'},
    'CA': {'name': 'Canada', 'flag': '🇨🇦', 'locale': 'en_US', 'symbol': '$', 'salary': (32000, 110000), 'json': 'sheerid_ca.json'},
    'AU': {'name': 'Australia', 'flag': '🇦🇺', 'locale': 'en_US', 'symbol': '$', 'salary': (45000, 130000), 'json': 'sheerid_au.json'},
    'SG': {'name': 'Singapore', 'flag': '🇸🇬', 'locale': 'en_US', 'symbol': '$', 'salary': (50000, 150000), 'json': 'sheerid_sg.json'},
    'JP': {'name': 'Japan', 'flag': '🇯🇵', 'locale': 'en_US', 'symbol': '¥', 'salary': (3000000, 10000000), 'json': 'sheerid_jp.json'},
    'DE': {'name': 'Germany', 'flag': '🇩🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (35000, 100000), 'json': 'sheerid_de.json'},
    'FR': {'name': 'France', 'flag': '🇫🇷', 'locale': 'en_US', 'symbol': '€', 'salary': (30000, 90000), 'json': 'sheerid_fr.json'},
    'PH': {'name': 'Philippines', 'flag': '🇵🇭', 'locale': 'en_US', 'symbol': '₱', 'salary': (180000, 800000), 'json': 'sheerid_ph.json'},
    'MY': {'name': 'Malaysia', 'flag': '🇲🇾', 'locale': 'en_US', 'symbol': 'RM', 'salary': (35000, 100000), 'json': 'sheerid_my.json'},
    'TH': {'name': 'Thailand', 'flag': '🇹🇭', 'locale': 'en_US', 'symbol': '฿', 'salary': (300000, 900000), 'json': 'sheerid_th.json'},
    'ID': {'name': 'Indonesia', 'flag': '🇮🇩', 'locale': 'en_US', 'symbol': 'Rp', 'salary': (40000000, 200000000), 'json': 'sheerid_id.json'},
    'VN': {'name': 'Vietnam', 'flag': '🇻🇳', 'locale': 'en_US', 'symbol': '₫', 'salary': (100000000, 500000000), 'json': 'sheerid_vn.json'},
    'KR': {'name': 'South Korea', 'flag': '🇰🇷', 'locale': 'en_US', 'symbol': '₩', 'salary': (30000000, 80000000), 'json': 'sheerid_kr.json'},
    'NZ': {'name': 'New Zealand', 'flag': '🇳🇿', 'locale': 'en_US', 'symbol': '$', 'salary': (40000, 120000), 'json': 'sheerid_nz.json'},
    'BR': {'name': 'Brazil', 'flag': '🇧🇷', 'locale': 'en_US', 'symbol': 'R$', 'salary': (30000, 120000), 'json': 'sheerid_br.json'},
    'MX': {'name': 'Mexico', 'flag': '🇲🇽', 'locale': 'en_US', 'symbol': '$', 'salary': (120000, 400000), 'json': 'sheerid_mx.json'},
    'ZA': {'name': 'South Africa', 'flag': '🇿🇦', 'locale': 'en_US', 'symbol': 'R', 'salary': (150000, 600000), 'json': 'sheerid_za.json'},
    'SA': {'name': 'Saudi Arabia', 'flag': '🇸🇦', 'locale': 'en_US', 'symbol': 'ر.س', 'salary': (100000, 400000), 'json': 'sheerid_sa.json'},
    'TR': {'name': 'Turkey', 'flag': '🇹🇷', 'locale': 'en_US', 'symbol': '₺', 'salary': (100000, 400000), 'json': 'sheerid_tr.json'},
    'PK': {'name': 'Pakistan', 'flag': '🇵🇰', 'locale': 'en_US', 'symbol': 'Rs', 'salary': (300000, 1200000), 'json': 'sheerid_pk.json'},
    'NL': {'name': 'Netherlands', 'flag': '🇳🇱', 'locale': 'en_US', 'symbol': '€', 'salary': (35000, 95000), 'json': 'sheerid_nl.json'},
    'SE': {'name': 'Sweden', 'flag': '🇸🇪', 'locale': 'en_US', 'symbol': 'kr', 'salary': (350000, 900000), 'json': 'sheerid_se.json'},
    'NO': {'name': 'Norway', 'flag': '🇳🇴', 'locale': 'en_US', 'symbol': 'kr', 'salary': (400000, 1000000), 'json': 'sheerid_no.json'},
    'ES': {'name': 'Spain', 'flag': '🇪🇸', 'locale': 'en_US', 'symbol': '€', 'salary': (25000, 70000), 'json': 'sheerid_es.json'},
    'IT': {'name': 'Italy', 'flag': '🇮🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (28000, 75000), 'json': 'sheerid_it.json'},
    'RU': {'name': 'Russia', 'flag': '🇷🇺', 'locale': 'en_US', 'symbol': '₽', 'salary': (300000, 1200000), 'json': 'sheerid_ru.json'},
    'CN': {'name': 'China', 'flag': '🇨🇳', 'locale': 'en_US', 'symbol': '¥', 'salary': (100000, 500000), 'json': 'sheerid_cn.json'},
    'HK': {'name': 'Hong Kong', 'flag': '🇭🇰', 'locale': 'en_US', 'symbol': 'HK$', 'salary': (300000, 1000000), 'json': 'sheerid_hk.json'},
    'TW': {'name': 'Taiwan', 'flag': '🇹🇼', 'locale': 'en_US', 'symbol': 'NT$', 'salary': (300000, 1000000), 'json': 'sheerid_tw.json'},
    'IL': {'name': 'Israel', 'flag': '🇮🇱', 'locale': 'en_US', 'symbol': '₪', 'salary': (80000, 300000), 'json': 'sheerid_il.json'},
    'EG': {'name': 'Egypt', 'flag': '🇪🇬', 'locale': 'en_US', 'symbol': 'E£', 'salary': (100000, 400000), 'json': 'sheerid_eg.json'},
    'KE': {'name': 'Kenya', 'flag': '🇰🇪', 'locale': 'en_US', 'symbol': 'KSh', 'salary': (400000, 1500000), 'json': 'sheerid_ke.json'},
    'NG': {'name': 'Nigeria', 'flag': '🇳🇬', 'locale': 'en_US', 'symbol': '₦', 'salary': (1000000, 5000000), 'json': 'sheerid_ng.json'},
    'BD': {'name': 'Bangladesh', 'flag': '🇧🇩', 'locale': 'en_US', 'symbol': '৳', 'salary': (200000, 800000), 'json': 'sheerid_bd.json'},
    'LK': {'name': 'Sri Lanka', 'flag': '🇱🇰', 'locale': 'en_US', 'symbol': 'Rs', 'salary': (300000, 1200000), 'json': 'sheerid_lk.json'},
    'PL': {'name': 'Poland', 'flag': '🇵🇱', 'locale': 'en_US', 'symbol': 'zł', 'salary': (50000, 150000), 'json': 'sheerid_pl.json'},
    'AR': {'name': 'Argentina', 'flag': '🇦🇷', 'locale': 'en_US', 'symbol': '$', 'salary': (300000, 1000000), 'json': 'sheerid_ar.json'},
    'CL': {'name': 'Chile', 'flag': '🇨🇱', 'locale': 'en_US', 'symbol': '$', 'salary': (6000000, 20000000), 'json': 'sheerid_cl.json'},
    'CO': {'name': 'Colombia', 'flag': '🇨🇴', 'locale': 'en_US', 'symbol': '$', 'salary': (20000000, 80000000), 'json': 'sheerid_co.json'},
    'DK': {'name': 'Denmark', 'flag': '🇩🇰', 'locale': 'en_US', 'symbol': 'kr', 'salary': (380000, 950000), 'json': 'sheerid_dk.json'},
    'FI': {'name': 'Finland', 'flag': '🇫🇮', 'locale': 'en_US', 'symbol': '€', 'salary': (35000, 90000), 'json': 'sheerid_fi.json'},
    'GR': {'name': 'Greece', 'flag': '🇬🇷', 'locale': 'en_US', 'symbol': '€', 'salary': (25000, 70000), 'json': 'sheerid_gr.json'},
    'PT': {'name': 'Portugal', 'flag': '🇵🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (20000, 60000), 'json': 'sheerid_pt.json'},
    'CH': {'name': 'Switzerland', 'flag': '🇨🇭', 'locale': 'en_US', 'symbol': 'CHF', 'salary': (80000, 200000), 'json': 'sheerid_ch.json'},
    'AT': {'name': 'Austria', 'flag': '🇦🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (35000, 85000), 'json': 'sheerid_at.json'},
    'BE': {'name': 'Belgium', 'flag': '🇧🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (30000, 75000), 'json': 'sheerid_be.json'},
    'CZ': {'name': 'Czech Republic', 'flag': '🇨🇿', 'locale': 'en_US', 'symbol': 'Kč', 'salary': (250000, 800000), 'json': 'sheerid_cz.json'},
    'HU': {'name': 'Hungary', 'flag': '🇭🇺', 'locale': 'en_US', 'symbol': 'Ft', 'salary': (2000000, 6000000), 'json': 'sheerid_hu.json'},
    'SK': {'name': 'Slovakia', 'flag': '🇸🇰', 'locale': 'en_US', 'symbol': '€', 'salary': (25000, 70000), 'json': 'sheerid_sk.json'},
    'RO': {'name': 'Romania', 'flag': '🇷🇴', 'locale': 'en_US', 'symbol': 'lei', 'salary': (30000, 80000), 'json': 'sheerid_ro.json'},
    'IR': {'name': 'Iran', 'flag': '🇮🇷', 'locale': 'en_US', 'symbol': '﷼', 'salary': (100000000, 500000000), 'json': 'sheerid_ir.json'},
    'IQ': {'name': 'Iraq', 'flag': '🇮🇶', 'locale': 'en_US', 'symbol': 'ع.د', 'salary': (500000, 2000000), 'json': 'sheerid_iq.json'},
    'JO': {'name': 'Jordan', 'flag': '🇯🇴', 'locale': 'en_US', 'symbol': 'د.ا', 'salary': (200000, 800000), 'json': 'sheerid_jo.json'},
    'LB': {'name': 'Lebanon', 'flag': '🇱🇧', 'locale': 'en_US', 'symbol': 'ل.ل', 'salary': (1000000, 5000000), 'json': 'sheerid_lb.json'},
    'OM': {'name': 'Oman', 'flag': '🇴🇲', 'locale': 'en_US', 'symbol': 'ر.ع.', 'salary': (500000, 2000000), 'json': 'sheerid_om.json'},
    'KW': {'name': 'Kuwait', 'flag': '🇰🇼', 'locale': 'en_US', 'symbol': 'د.ك', 'salary': (1000000, 5000000), 'json': 'sheerid_kw.json'},
    'QA': {'name': 'Qatar', 'flag': '🇶🇦', 'locale': 'en_US', 'symbol': 'ر.ق', 'salary': (2000000, 8000000), 'json': 'sheerid_qa.json'},
    'BH': {'name': 'Bahrain', 'flag': '🇧🇭', 'locale': 'en_US', 'symbol': '.د.ب', 'salary': (500000, 2000000), 'json': 'sheerid_bh.json'},
    'AZ': {'name': 'Azerbaijan', 'flag': '🇦🇿', 'locale': 'en_US', 'symbol': '₼', 'salary': (15000, 50000), 'json': 'sheerid_az.json'},
    'KZ': {'name': 'Kazakhstan', 'flag': '🇰🇿', 'locale': 'en_US', 'symbol': '₸', 'salary': (2000000, 8000000), 'json': 'sheerid_kz.json'},
    'UZ': {'name': 'Uzbekistan', 'flag': '🇺🇿', 'locale': 'en_US', 'symbol': 'сўм', 'salary': (1000000, 5000000), 'json': 'sheerid_uz.json'},
    'TJ': {'name': 'Tajikistan', 'flag': '🇹🇯', 'locale': 'en_US', 'symbol': 'ЅМ', 'salary': (300000, 1200000), 'json': 'sheerid_tj.json'},
    'KG': {'name': 'Kyrgyzstan', 'flag': '🇰🇬', 'locale': 'en_US', 'symbol': 'лв', 'salary': (200000, 800000), 'json': 'sheerid_kg.json'},
    'TM': {'name': 'Turkmenistan', 'flag': '🇹🇲', 'locale': 'en_US', 'symbol': 'T', 'salary': (1000000, 4000000), 'json': 'sheerid_tm.json'},
    'AF': {'name': 'Afghanistan', 'flag': '🇦🇫', 'locale': 'en_US', 'symbol': '؋', 'salary': (10000000, 50000000), 'json': 'sheerid_af.json'},
    'NP': {'name': 'Nepal', 'flag': '🇳🇵', 'locale': 'en_US', 'symbol': 'Rs', 'salary': (200000, 800000), 'json': 'sheerid_np.json'},
    'BT': {'name': 'Bhutan', 'flag': '🇧🇹', 'locale': 'en_US', 'symbol': 'Nu.', 'salary': (100000, 500000), 'json': 'sheerid_bt.json'},
    'MM': {'name': 'Myanmar', 'flag': '🇲🇲', 'locale': 'en_US', 'symbol': 'K', 'salary': (3000000, 12000000), 'json': 'sheerid_mm.json'},
    'LA': {'name': 'Laos', 'flag': '🇱🇦', 'locale': 'en_US', 'symbol': '₭', 'salary': (30000000, 120000000), 'json': 'sheerid_la.json'},
    'UY': {'name': 'Uruguay', 'flag': '🇺🇾', 'locale': 'en_US', 'symbol': '$', 'salary': (300000, 1000000), 'json': 'sheerid_uy.json'},
    'PE': {'name': 'Peru', 'flag': '🇵🇪', 'locale': 'en_US', 'symbol': 'S/.', 'salary': (15000, 60000), 'json': 'sheerid_pe.json'},
    'EC': {'name': 'Ecuador', 'flag': '🇪🇨', 'locale': 'en_US', 'symbol': '$', 'salary': (15000, 50000), 'json': 'sheerid_ec.json'},
    'VE': {'name': 'Venezuela', 'flag': '🇻🇪', 'locale': 'en_US', 'symbol': 'Bs', 'salary': (500000, 2000000), 'json': 'sheerid_ve.json'},
    'BO': {'name': 'Bolivia', 'flag': '🇧🇴', 'locale': 'en_US', 'symbol': 'Bs', 'salary': (1500, 6000), 'json': 'sheerid_bo.json'},
    'PY': {'name': 'Paraguay', 'flag': '🇵🇾', 'locale': 'en_US', 'symbol': '₲', 'salary': (3000000, 15000000), 'json': 'sheerid_py.json'},
    'CR': {'name': 'Costa Rica', 'flag': '🇨🇷', 'locale': 'en_US', 'symbol': '₡', 'salary': (500000, 2000000), 'json': 'sheerid_cr.json'},
    'PA': {'name': 'Panama', 'flag': '🇵🇦', 'locale': 'en_US', 'symbol': 'B/.', 'salary': (800, 3500), 'json': 'sheerid_pa.json'},
    'CU': {'name': 'Cuba', 'flag': '🇨🇺', 'locale': 'en_US', 'symbol': '₱', 'salary': (250, 800), 'json': 'sheerid_cu.json'},
    'DO': {'name': 'Dominican Republic', 'flag': '🇩🇴', 'locale': 'en_US', 'symbol': 'RD$', 'salary': (500000, 1500000), 'json': 'sheerid_do.json'},
    'TT': {'name': 'Trinidad and Tobago', 'flag': '🇹🇹', 'locale': 'en_US', 'symbol': 'TT$', 'salary': (20000, 80000), 'json': 'sheerid_tt.json'},
    'JM': {'name': 'Jamaica', 'flag': '🇯🇲', 'locale': 'en_US', 'symbol': 'J$', 'salary': (800000, 3000000), 'json': 'sheerid_jm.json'},
    'BS': {'name': 'Bahamas', 'flag': '🇧🇸', 'locale': 'en_US', 'symbol': 'B$', 'salary': (25000, 80000), 'json': 'sheerid_bs.json'},
    'BZ': {'name': 'Belize', 'flag': '🇧🇿', 'locale': 'en_US', 'symbol': 'BZ$', 'salary': (15000, 50000), 'json': 'sheerid_bz.json'},
    'LC': {'name': 'Saint Lucia', 'flag': '🇱🇨', 'locale': 'en_US', 'symbol': 'EC$', 'salary': (20000, 65000), 'json': 'sheerid_lc.json'},
    'GD': {'name': 'Grenada', 'flag': '🇬🇩', 'locale': 'en_US', 'symbol': 'EC$', 'salary': (18000, 60000), 'json': 'sheerid_gd.json'},
    'VC': {'name': 'Saint Vincent', 'flag': '🇻🇨', 'locale': 'en_US', 'symbol': 'EC$', 'salary': (18000, 60000), 'json': 'sheerid_vc.json'},
    'AG': {'name': 'Antigua and Barbuda', 'flag': '🇦🇬', 'locale': 'en_US', 'symbol': 'EC$', 'salary': (20000, 65000), 'json': 'sheerid_ag.json'},
    'DM': {'name': 'Dominica', 'flag': '🇩🇲', 'locale': 'en_US', 'symbol': 'EC$', 'salary': (18000, 60000), 'json': 'sheerid_dm.json'},
    'KN': {'name': 'Saint Kitts and Nevis', 'flag': '🇰🇳', 'locale': 'en_US', 'symbol': 'EC$', 'salary': (20000, 65000), 'json': 'sheerid_kn.json'},
    'BB': {'name': 'Barbados', 'flag': '🇧🇧', 'locale': 'en_US', 'symbol': 'Bds$', 'salary': (25000, 80000), 'json': 'sheerid_bb.json'},
    'SY': {'name': 'Syria', 'flag': '🇸🇾', 'locale': 'en_US', 'symbol': '£', 'salary': (100000, 400000), 'json': 'sheerid_sy.json'},
    'YE': {'name': 'Yemen', 'flag': '🇾🇪', 'locale': 'en_US', 'symbol': '﷼', 'salary': (500000, 2000000), 'json': 'sheerid_ye.json'},
    'LY': {'name': 'Libya', 'flag': '🇱🇾', 'locale': 'en_US', 'symbol': 'LD', 'salary': (500000, 2000000), 'json': 'sheerid_ly.json'},
    'SD': {'name': 'Sudan', 'flag': '🇸🇩', 'locale': 'en_US', 'symbol': 'SDG', 'salary': (5000000, 20000000), 'json': 'sheerid_sd.json'},
    'ET': {'name': 'Ethiopia', 'flag': '🇪🇹', 'locale': 'en_US', 'symbol': 'Br', 'salary': (2000, 10000), 'json': 'sheerid_et.json'},
    'TZ': {'name': 'Tanzania', 'flag': '🇹🇿', 'locale': 'en_US', 'symbol': 'TSh', 'salary': (1000000, 5000000), 'json': 'sheerid_tz.json'},
    'UG': {'name': 'Uganda', 'flag': '🇺🇬', 'locale': 'en_US', 'symbol': 'USh', 'salary': (2000000, 8000000), 'json': 'sheerid_ug.json'},
    'RW': {'name': 'Rwanda', 'flag': '🇷🇼', 'locale': 'en_US', 'symbol': 'FRw', 'salary': (500000, 2000000), 'json': 'sheerid_rw.json'},
    'BW': {'name': 'Botswana', 'flag': '🇧🇼', 'locale': 'en_US', 'symbol': 'P', 'salary': (100000, 500000), 'json': 'sheerid_bw.json'},
    'NA': {'name': 'Namibia', 'flag': '🇳🇦', 'locale': 'en_US', 'symbol': '$', 'salary': (80000, 400000), 'json': 'sheerid_na.json'},
    'MZ': {'name': 'Mozambique', 'flag': '🇲🇿', 'locale': 'en_US', 'symbol': 'MT', 'salary': (300000, 1200000), 'json': 'sheerid_mz.json'},
    'ZM': {'name': 'Zambia', 'flag': '🇿🇲', 'locale': 'en_US', 'symbol': 'ZK', 'salary': (5000, 20000), 'json': 'sheerid_zm.json'},
    'ZW': {'name': 'Zimbabwe', 'flag': '🇿🇼', 'locale': 'en_US', 'symbol': '$', 'salary': (300, 1500), 'json': 'sheerid_zw.json'},
    'MW': {'name': 'Malawi', 'flag': '🇲🇼', 'locale': 'en_US', 'symbol': 'MK', 'salary': (1000000, 5000000), 'json': 'sheerid_mw.json'},
    'LS': {'name': 'Lesotho', 'flag': '🇱🇸', 'locale': 'en_US', 'symbol': 'L', 'salary': (50000, 200000), 'json': 'sheerid_ls.json'},
    'SZ': {'name': 'Eswatini', 'flag': '🇸🇿', 'locale': 'en_US', 'symbol': 'E', 'salary': (50000, 200000), 'json': 'sheerid_sz.json'},
    'MG': {'name': 'Madagascar', 'flag': '🇲🇬', 'locale': 'en_US', 'symbol': 'Ar', 'salary': (200000, 800000), 'json': 'sheerid_mg.json'},
    'MU': {'name': 'Mauritius', 'flag': '🇲🇺', 'locale': 'en_US', 'symbol': '₨', 'salary': (250000, 1000000), 'json': 'sheerid_mu.json'},
    'SC': {'name': 'Seychelles', 'flag': '🇸🇨', 'locale': 'en_US', 'symbol': '₨', 'salary': (150000, 600000), 'json': 'sheerid_sc.json'},
    'GH': {'name': 'Ghana', 'flag': '🇬🇭', 'locale': 'en_US', 'symbol': '₵', 'salary': (3000, 15000), 'json': 'sheerid_gh.json'},
    'CI': {'name': 'Ivory Coast', 'flag': '🇨🇮', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (500000, 2000000), 'json': 'sheerid_ci.json'},
    'SN': {'name': 'Senegal', 'flag': '🇸🇳', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (500000, 2000000), 'json': 'sheerid_sn.json'},
    'BJ': {'name': 'Benin', 'flag': '🇧🇯', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (400000, 1500000), 'json': 'sheerid_bj.json'},
    'BF': {'name': 'Burkina Faso', 'flag': '🇧🇫', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (400000, 1500000), 'json': 'sheerid_bf.json'},
    'ML': {'name': 'Mali', 'flag': '🇲🇱', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (300000, 1200000), 'json': 'sheerid_ml.json'},
    'NE': {'name': 'Niger', 'flag': '🇳🇪', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (300000, 1200000), 'json': 'sheerid_ne.json'},
    'TD': {'name': 'Chad', 'flag': '🇹🇩', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (300000, 1200000), 'json': 'sheerid_td.json'},
    'CM': {'name': 'Cameroon', 'flag': '🇨🇲', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (500000, 2000000), 'json': 'sheerid_cm.json'},
    'GA': {'name': 'Gabon', 'flag': '🇬🇦', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (500000, 2000000), 'json': 'sheerid_ga.json'},
    'CG': {'name': 'Congo', 'flag': '🇨🇬', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (500000, 2000000), 'json': 'sheerid_cg.json'},
    'AO': {'name': 'Angola', 'flag': '🇦🇴', 'locale': 'en_US', 'symbol': 'Kz', 'salary': (500000, 2000000), 'json': 'sheerid_ao.json'},
    'GW': {'name': 'Guinea-Bissau', 'flag': '🇬🇼', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (300000, 1000000), 'json': 'sheerid_gw.json'},
    'GM': {'name': 'Gambia', 'flag': '🇬🇲', 'locale': 'en_US', 'symbol': 'D', 'salary': (300000, 1000000), 'json': 'sheerid_gm.json'},
    'MR': {'name': 'Mauritania', 'flag': '🇲🇷', 'locale': 'en_US', 'symbol': 'UM', 'salary': (500000, 2000000), 'json': 'sheerid_mr.json'},
    'CV': {'name': 'Cape Verde', 'flag': '🇨🇻', 'locale': 'en_US', 'symbol': '$', 'salary': (80000, 400000), 'json': 'sheerid_cv.json'},
    'DJ': {'name': 'Djibouti', 'flag': '🇩🇯', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (500000, 2000000), 'json': 'sheerid_dj.json'},
    'ER': {'name': 'Eritrea', 'flag': '🇪🇷', 'locale': 'en_US', 'symbol': 'Nfk', 'salary': (100000, 500000), 'json': 'sheerid_er.json'},
}

# Additional countries to push the list past 200 options
EXTRA_COUNTRIES = {
    'AD': {'name': 'Andorra', 'flag': '🇦🇩', 'locale': 'en_US', 'symbol': '€', 'salary': (32000, 90000), 'json': 'sheerid_ad.json'},
    'AL': {'name': 'Albania', 'flag': '🇦🇱', 'locale': 'en_US', 'symbol': 'L', 'salary': (250000, 900000), 'json': 'sheerid_al.json'},
    'AM': {'name': 'Armenia', 'flag': '🇦🇲', 'locale': 'en_US', 'symbol': '֏', 'salary': (1800000, 6000000), 'json': 'sheerid_am.json'},
    'AT': {'name': 'Austria', 'flag': '🇦🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (32000, 110000), 'json': 'sheerid_at.json'},
    'AZ': {'name': 'Azerbaijan', 'flag': '🇦🇿', 'locale': 'en_US', 'symbol': '₼', 'salary': (15000, 60000), 'json': 'sheerid_az.json'},
    'BA': {'name': 'Bosnia and Herzegovina', 'flag': '🇧🇦', 'locale': 'en_US', 'symbol': 'KM', 'salary': (15000, 50000), 'json': 'sheerid_ba.json'},
    'BD': {'name': 'Bangladesh', 'flag': '🇧🇩', 'locale': 'en_US', 'symbol': '৳', 'salary': (300000, 1200000), 'json': 'sheerid_bd.json'},
    'BE': {'name': 'Belgium', 'flag': '🇧🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (35000, 110000), 'json': 'sheerid_be.json'},
    'BH': {'name': 'Bahrain', 'flag': '🇧🇭', 'locale': 'en_US', 'symbol': 'ب.د', 'salary': (12000, 65000), 'json': 'sheerid_bh.json'},
    'BN': {'name': 'Brunei', 'flag': '🇧🇳', 'locale': 'en_US', 'symbol': 'B$', 'salary': (30000, 150000), 'json': 'sheerid_bn.json'},
    'BT': {'name': 'Bhutan', 'flag': '🇧🇹', 'locale': 'en_US', 'symbol': 'Nu.', 'salary': (200000, 800000), 'json': 'sheerid_bt.json'},
    'BW2': {'name': 'Botswana (North)', 'flag': '🇧🇼', 'locale': 'en_US', 'symbol': 'P', 'salary': (120000, 520000), 'json': 'sheerid_bw2.json'},
    'BY': {'name': 'Belarus', 'flag': '🇧🇾', 'locale': 'en_US', 'symbol': 'Br', 'salary': (120000, 500000), 'json': 'sheerid_by.json'},
    'CH': {'name': 'Switzerland', 'flag': '🇨🇭', 'locale': 'en_US', 'symbol': 'CHF', 'salary': (60000, 150000), 'json': 'sheerid_ch.json'},
    'CL': {'name': 'Chile', 'flag': '🇨🇱', 'locale': 'en_US', 'symbol': '$', 'salary': (8000000, 20000000), 'json': 'sheerid_cl.json'},
    'CO': {'name': 'Colombia', 'flag': '🇨🇴', 'locale': 'en_US', 'symbol': '$', 'salary': (10000000, 40000000), 'json': 'sheerid_co.json'},
    'CR2': {'name': 'Costa Rica Pacific', 'flag': '🇨🇷', 'locale': 'en_US', 'symbol': '₡', 'salary': (600000, 2400000), 'json': 'sheerid_cr2.json'},
    'CU2': {'name': 'Cuba (Isla de la Juventud)', 'flag': '🇨🇺', 'locale': 'en_US', 'symbol': '₱', 'salary': (260, 900), 'json': 'sheerid_cu2.json'},
    'CY': {'name': 'Cyprus', 'flag': '🇨🇾', 'locale': 'en_US', 'symbol': '€', 'salary': (28000, 95000), 'json': 'sheerid_cy.json'},
    'CZ': {'name': 'Czechia', 'flag': '🇨🇿', 'locale': 'en_US', 'symbol': 'Kč', 'salary': (300000, 900000), 'json': 'sheerid_cz.json'},
    'DK': {'name': 'Denmark', 'flag': '🇩🇰', 'locale': 'en_US', 'symbol': 'kr', 'salary': (400000, 1200000), 'json': 'sheerid_dk.json'},
    'EE': {'name': 'Estonia', 'flag': '🇪🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (28000, 80000), 'json': 'sheerid_ee.json'},
    'EG': {'name': 'Egypt', 'flag': '🇪🇬', 'locale': 'en_US', 'symbol': '£', 'salary': (120000, 600000), 'json': 'sheerid_eg.json'},
    'FI': {'name': 'Finland', 'flag': '🇫🇮', 'locale': 'en_US', 'symbol': '€', 'salary': (32000, 100000), 'json': 'sheerid_fi.json'},
    'FO': {'name': 'Faroe Islands', 'flag': '🇫🇴', 'locale': 'en_US', 'symbol': 'kr', 'salary': (350000, 900000), 'json': 'sheerid_fo.json'},
    'GE': {'name': 'Georgia', 'flag': '🇬🇪', 'locale': 'en_US', 'symbol': '₾', 'salary': (20000, 90000), 'json': 'sheerid_ge.json'},
    'GL': {'name': 'Greenland', 'flag': '🇬🇱', 'locale': 'en_US', 'symbol': 'kr', 'salary': (400000, 1100000), 'json': 'sheerid_gl.json'},
    'GN': {'name': 'Guinea', 'flag': '🇬🇳', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (500000, 1600000), 'json': 'sheerid_gn.json'},
    'GR': {'name': 'Greece', 'flag': '🇬🇷', 'locale': 'en_US', 'symbol': '€', 'salary': (25000, 80000), 'json': 'sheerid_gr.json'},
    'GT': {'name': 'Guatemala', 'flag': '🇬🇹', 'locale': 'en_US', 'symbol': 'Q', 'salary': (60000, 200000), 'json': 'sheerid_gt.json'},
    'HN': {'name': 'Honduras', 'flag': '🇭🇳', 'locale': 'en_US', 'symbol': 'L', 'salary': (8000, 35000), 'json': 'sheerid_hn.json'},
    'HR': {'name': 'Croatia', 'flag': '🇭🇷', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': 'sheerid_hr.json'},
    'HT': {'name': 'Haiti', 'flag': '🇭🇹', 'locale': 'en_US', 'symbol': 'G', 'salary': (2000, 8000), 'json': 'sheerid_ht.json'},
    'HU': {'name': 'Hungary', 'flag': '🇭🇺', 'locale': 'en_US', 'symbol': 'Ft', 'salary': (5000000, 15000000), 'json': 'sheerid_hu.json'},
    'IE': {'name': 'Ireland', 'flag': '🇮🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (32000, 100000), 'json': 'sheerid_ie.json'},
    'IL': {'name': 'Israel', 'flag': '🇮🇱', 'locale': 'en_US', 'symbol': '₪', 'salary': (100000, 450000), 'json': 'sheerid_il.json'},
    'IQ': {'name': 'Iraq', 'flag': '🇮🇶', 'locale': 'en_US', 'symbol': 'ع.د', 'salary': (400000, 1800000), 'json': 'sheerid_iq.json'},
    'IR': {'name': 'Iran', 'flag': '🇮🇷', 'locale': 'en_US', 'symbol': '﷼', 'salary': (60000000, 200000000), 'json': 'sheerid_ir.json'},
    'IS': {'name': 'Iceland', 'flag': '🇮🇸', 'locale': 'en_US', 'symbol': 'kr', 'salary': (5000000, 15000000), 'json': 'sheerid_is.json'},
    'JO': {'name': 'Jordan', 'flag': '🇯🇴', 'locale': 'en_US', 'symbol': 'د.ا', 'salary': (12000, 50000), 'json': 'sheerid_jo.json'},
    'KE': {'name': 'Kenya', 'flag': '🇰🇪', 'locale': 'en_US', 'symbol': 'KSh', 'salary': (600000, 2000000), 'json': 'sheerid_ke.json'},
    'KG': {'name': 'Kyrgyzstan', 'flag': '🇰🇬', 'locale': 'en_US', 'symbol': 'с', 'salary': (200000, 900000), 'json': 'sheerid_kg.json'},
    'KH': {'name': 'Cambodia', 'flag': '🇰🇭', 'locale': 'en_US', 'symbol': '៛', 'salary': (4000000, 12000000), 'json': 'sheerid_kh.json'},
    'KM': {'name': 'Comoros', 'flag': '🇰🇲', 'locale': 'en_US', 'symbol': 'Fr', 'salary': (300000, 900000), 'json': 'sheerid_km.json'},
    'KW': {'name': 'Kuwait', 'flag': '🇰🇼', 'locale': 'en_US', 'symbol': 'د.ك', 'salary': (15000, 90000), 'json': 'sheerid_kw.json'},
    'KZ': {'name': 'Kazakhstan', 'flag': '🇰🇿', 'locale': 'en_US', 'symbol': '₸', 'salary': (4000000, 18000000), 'json': 'sheerid_kz.json'},
    'LB': {'name': 'Lebanon', 'flag': '🇱🇧', 'locale': 'en_US', 'symbol': 'ل.ل', 'salary': (8000000, 20000000), 'json': 'sheerid_lb.json'},
    'LI': {'name': 'Liechtenstein', 'flag': '🇱🇮', 'locale': 'en_US', 'symbol': 'CHF', 'salary': (50000, 150000), 'json': 'sheerid_li.json'},
    'LK': {'name': 'Sri Lanka', 'flag': '🇱🇰', 'locale': 'en_US', 'symbol': 'Rs', 'salary': (600000, 2000000), 'json': 'sheerid_lk.json'},
    'LT': {'name': 'Lithuania', 'flag': '🇱🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': 'sheerid_lt.json'},
    'LU': {'name': 'Luxembourg', 'flag': '🇱🇺', 'locale': 'en_US', 'symbol': '€', 'salary': (40000, 140000), 'json': 'sheerid_lu.json'},
    'LV': {'name': 'Latvia', 'flag': '🇱🇻', 'locale': 'en_US', 'symbol': '€', 'salary': (23000, 80000), 'json': 'sheerid_lv.json'},
    'MA': {'name': 'Morocco', 'flag': '🇲🇦', 'locale': 'en_US', 'symbol': 'د.م.', 'salary': (70000, 300000), 'json': 'sheerid_ma.json'},
    'MD': {'name': 'Moldova', 'flag': '🇲🇩', 'locale': 'en_US', 'symbol': 'L', 'salary': (60000, 220000), 'json': 'sheerid_md.json'},
    'ME': {'name': 'Montenegro', 'flag': '🇲🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (20000, 70000), 'json': 'sheerid_me.json'},
    'MK': {'name': 'North Macedonia', 'flag': '🇲🇰', 'locale': 'en_US', 'symbol': 'ден', 'salary': (300000, 900000), 'json': 'sheerid_mk.json'},
    'MN': {'name': 'Mongolia', 'flag': '🇲🇳', 'locale': 'en_US', 'symbol': '₮', 'salary': (8000000, 22000000), 'json': 'sheerid_mn.json'},
    'MT': {'name': 'Malta', 'flag': '🇲🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (28000, 85000), 'json': 'sheerid_mt.json'},
    'MV': {'name': 'Maldives', 'flag': '🇲🇻', 'locale': 'en_US', 'symbol': 'Rf', 'salary': (100000, 500000), 'json': 'sheerid_mv.json'},
    'MX2': {'name': 'Mexico (North)', 'flag': '🇲🇽', 'locale': 'en_US', 'symbol': '$', 'salary': (150000, 450000), 'json': 'sheerid_mx2.json'},
    'MY2': {'name': 'Malaysia (Borneo)', 'flag': '🇲🇾', 'locale': 'en_US', 'symbol': 'RM', 'salary': (38000, 110000), 'json': 'sheerid_my2.json'},
    'NG': {'name': 'Nigeria', 'flag': '🇳🇬', 'locale': 'en_US', 'symbol': '₦', 'salary': (500000, 2000000), 'json': 'sheerid_ng.json'},
    'NI': {'name': 'Nicaragua', 'flag': '🇳🇮', 'locale': 'en_US', 'symbol': 'C$', 'salary': (8000, 25000), 'json': 'sheerid_ni.json'},
    'NP': {'name': 'Nepal', 'flag': '🇳🇵', 'locale': 'en_US', 'symbol': '₨', 'salary': (200000, 900000), 'json': 'sheerid_np.json'},
    'OM': {'name': 'Oman', 'flag': '🇴🇲', 'locale': 'en_US', 'symbol': '﷼', 'salary': (15000, 90000), 'json': 'sheerid_om.json'},
    'PL': {'name': 'Poland', 'flag': '🇵🇱', 'locale': 'en_US', 'symbol': 'zł', 'salary': (70000, 260000), 'json': 'sheerid_pl.json'},
    'PR': {'name': 'Puerto Rico', 'flag': '🇵🇷', 'locale': 'en_US', 'symbol': '$', 'salary': (28000, 90000), 'json': 'sheerid_pr.json'},
    'PT': {'name': 'Portugal', 'flag': '🇵🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (22000, 75000), 'json': 'sheerid_pt.json'},
    'QA': {'name': 'Qatar', 'flag': '🇶🇦', 'locale': 'en_US', 'symbol': 'ر.ق', 'salary': (20000, 120000), 'json': 'sheerid_qa.json'},
    'RO': {'name': 'Romania', 'flag': '🇷🇴', 'locale': 'en_US', 'symbol': 'lei', 'salary': (50000, 180000), 'json': 'sheerid_ro.json'},
    'RS': {'name': 'Serbia', 'flag': '🇷🇸', 'locale': 'en_US', 'symbol': 'дин', 'salary': (400000, 1200000), 'json': 'sheerid_rs.json'},
    'RW2': {'name': 'Rwanda Highlands', 'flag': '🇷🇼', 'locale': 'en_US', 'symbol': 'FRw', 'salary': (700000, 2400000), 'json': 'sheerid_rw2.json'},
    'SB': {'name': 'Solomon Islands', 'flag': '🇸🇧', 'locale': 'en_US', 'symbol': '$', 'salary': (60000, 200000), 'json': 'sheerid_sb.json'},
    'SI': {'name': 'Slovenia', 'flag': '🇸🇮', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': 'sheerid_si.json'},
    'SK': {'name': 'Slovakia', 'flag': '🇸🇰', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': 'sheerid_sk.json'},
    'SL': {'name': 'Sierra Leone', 'flag': '🇸🇱', 'locale': 'en_US', 'symbol': 'Le', 'salary': (500000, 2000000), 'json': 'sheerid_sl.json'},
    'SM': {'name': 'San Marino', 'flag': '🇸🇲', 'locale': 'en_US', 'symbol': '€', 'salary': (25000, 85000), 'json': 'sheerid_sm.json'},
    'SO': {'name': 'Somalia', 'flag': '🇸🇴', 'locale': 'en_US', 'symbol': 'Sh', 'salary': (500000, 2000000), 'json': 'sheerid_so.json'},
    'SS': {'name': 'South Sudan', 'flag': '🇸🇸', 'locale': 'en_US', 'symbol': '£', 'salary': (500000, 2000000), 'json': 'sheerid_ss.json'},
    'ST': {'name': 'Sao Tome and Principe', 'flag': '🇸🇹', 'locale': 'en_US', 'symbol': 'Db', 'salary': (100000, 400000), 'json': 'sheerid_st.json'},
    'SV': {'name': 'El Salvador', 'flag': '🇸🇻', 'locale': 'en_US', 'symbol': '$', 'salary': (5000, 20000), 'json': 'sheerid_sv.json'},
    'TJ': {'name': 'Tajikistan', 'flag': '🇹🇯', 'locale': 'en_US', 'symbol': 'ЅМ', 'salary': (300000, 1100000), 'json': 'sheerid_tj.json'},
    'TM': {'name': 'Turkmenistan', 'flag': '🇹🇲', 'locale': 'en_US', 'symbol': 'm', 'salary': (200000, 800000), 'json': 'sheerid_tm.json'},
    'TN': {'name': 'Tunisia', 'flag': '🇹🇳', 'locale': 'en_US', 'symbol': 'د.ت', 'salary': (12000, 60000), 'json': 'sheerid_tn.json'},
    'UA': {'name': 'Ukraine', 'flag': '🇺🇦', 'locale': 'en_US', 'symbol': '₴', 'salary': (120000, 450000), 'json': 'sheerid_ua.json'},
    'UG2': {'name': 'Uganda West', 'flag': '🇺🇬', 'locale': 'en_US', 'symbol': 'USh', 'salary': (2200000, 9000000), 'json': 'sheerid_ug2.json'},
    'UY2': {'name': 'Uruguay Coast', 'flag': '🇺🇾', 'locale': 'en_US', 'symbol': '$', 'salary': (320000, 1200000), 'json': 'sheerid_uy2.json'},
    'UZ': {'name': 'Uzbekistan', 'flag': '🇺🇿', 'locale': 'en_US', 'symbol': 'soʻm', 'salary': (5000000, 20000000), 'json': 'sheerid_uz.json'},
    'VA': {'name': 'Vatican City', 'flag': '🇻🇦', 'locale': 'en_US', 'symbol': '€', 'salary': (30000, 90000), 'json': 'sheerid_va.json'},
    'VI': {'name': 'U.S. Virgin Islands', 'flag': '🇻🇮', 'locale': 'en_US', 'symbol': '$', 'salary': (28000, 85000), 'json': 'sheerid_vi.json'},
    'VN2': {'name': 'Vietnam Highlands', 'flag': '🇻🇳', 'locale': 'en_US', 'symbol': '₫', 'salary': (120000000, 520000000), 'json': 'sheerid_vn2.json'},
    'WS': {'name': 'Samoa', 'flag': '🇼🇸', 'locale': 'en_US', 'symbol': 'T', 'salary': (20000, 70000), 'json': 'sheerid_ws.json'},
    'X01': {'name': 'Aruba', 'flag': '🇦🇼', 'locale': 'en_US', 'symbol': 'ƒ', 'salary': (20000, 70000), 'json': ''},
    'X02': {'name': 'Bermuda', 'flag': '🇧🇲', 'locale': 'en_US', 'symbol': '$', 'salary': (40000, 120000), 'json': ''},
    'X03': {'name': 'Cayman Islands', 'flag': '🇰🇾', 'locale': 'en_US', 'symbol': '$', 'salary': (35000, 110000), 'json': ''},
    'X04': {'name': 'Curacao', 'flag': '🇨🇼', 'locale': 'en_US', 'symbol': 'ƒ', 'salary': (25000, 80000), 'json': ''},
    'X05': {'name': 'Fiji', 'flag': '🇫🇯', 'locale': 'en_US', 'symbol': '$', 'salary': (20000, 70000), 'json': ''},
    'X06': {'name': 'Gibraltar', 'flag': '🇬🇮', 'locale': 'en_US', 'symbol': '£', 'salary': (28000, 90000), 'json': ''},
    'X07': {'name': 'Guadeloupe', 'flag': '🇬🇵', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': ''},
    'X08': {'name': 'Guam', 'flag': '🇬🇺', 'locale': 'en_US', 'symbol': '$', 'salary': (28000, 90000), 'json': ''},
    'X09': {'name': 'Isle of Man', 'flag': '🇮🇲', 'locale': 'en_US', 'symbol': '£', 'salary': (32000, 100000), 'json': ''},
    'X10': {'name': 'Jersey', 'flag': '🇯🇪', 'locale': 'en_US', 'symbol': '£', 'salary': (32000, 100000), 'json': ''},
    'X11': {'name': 'Kosovo', 'flag': '🇽🇰', 'locale': 'en_US', 'symbol': '€', 'salary': (20000, 65000), 'json': ''},
    'X12': {'name': 'La Reunion', 'flag': '🇷🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': ''},
    'X13': {'name': 'Liege Region', 'flag': '🇧🇪', 'locale': 'en_US', 'symbol': '€', 'salary': (28000, 95000), 'json': ''},
    'X14': {'name': 'Macau', 'flag': '🇲🇴', 'locale': 'en_US', 'symbol': 'MOP$', 'salary': (120000, 450000), 'json': ''},
    'X15': {'name': 'Martinique', 'flag': '🇲🇶', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': ''},
    'X16': {'name': 'Mayotte', 'flag': '🇾🇹', 'locale': 'en_US', 'symbol': '€', 'salary': (20000, 70000), 'json': ''},
    'X17': {'name': 'Macao Peninsula', 'flag': '🇲🇴', 'locale': 'en_US', 'symbol': 'MOP$', 'salary': (120000, 450000), 'json': ''},
    'X18': {'name': 'Monaco Principality', 'flag': '🇲🇨', 'locale': 'en_US', 'symbol': '€', 'salary': (60000, 160000), 'json': ''},
    'X19': {'name': 'New Caledonia', 'flag': '🇳🇨', 'locale': 'en_US', 'symbol': '₣', 'salary': (24000, 85000), 'json': ''},
    'X20': {'name': 'Northern Cyprus', 'flag': '🇨🇾', 'locale': 'en_US', 'symbol': '₺', 'salary': (20000, 70000), 'json': ''},
    'X21': {'name': 'Northern Ireland', 'flag': '🇬🇧', 'locale': 'en_US', 'symbol': '£', 'salary': (25000, 90000), 'json': ''},
    'X22': {'name': 'Papua New Guinea', 'flag': '🇵🇬', 'locale': 'en_US', 'symbol': 'K', 'salary': (20000, 70000), 'json': ''},
    'X23': {'name': 'Pitcairn Islands', 'flag': '🇵🇳', 'locale': 'en_US', 'symbol': '$', 'salary': (20000, 70000), 'json': ''},
    'X24': {'name': 'Qeshm Free Zone', 'flag': '🇮🇷', 'locale': 'en_US', 'symbol': '﷼', 'salary': (70000000, 220000000), 'json': ''},
    'X25': {'name': 'Saint Pierre and Miquelon', 'flag': '🇵🇲', 'locale': 'en_US', 'symbol': '€', 'salary': (24000, 85000), 'json': ''},
    'X26': {'name': 'Sint Maarten', 'flag': '🇸🇽', 'locale': 'en_US', 'symbol': 'ƒ', 'salary': (25000, 80000), 'json': ''},
    'X27': {'name': 'Tahiti', 'flag': '🇵🇫', 'locale': 'en_US', 'symbol': '₣', 'salary': (24000, 85000), 'json': ''},
    'X28': {'name': 'Tasmania', 'flag': '🇦🇺', 'locale': 'en_US', 'symbol': '$', 'salary': (45000, 130000), 'json': ''},
    'X29': {'name': 'Tibet', 'flag': '🚩', 'locale': 'en_US', 'symbol': '¥', 'salary': (100000, 500000), 'json': ''},
    'X30': {'name': 'Tokelau', 'flag': '🇹🇰', 'locale': 'en_US', 'symbol': '$', 'salary': (15000, 50000), 'json': ''},
    'X31': {'name': 'Turks and Caicos', 'flag': '🇹🇨', 'locale': 'en_US', 'symbol': '$', 'salary': (28000, 90000), 'json': ''},
    'X32': {'name': 'Wallis and Futuna', 'flag': '🇼🇫', 'locale': 'en_US', 'symbol': '₣', 'salary': (20000, 70000), 'json': ''},
    'X33': {'name': 'Yukon', 'flag': '🇨🇦', 'locale': 'en_US', 'symbol': '$', 'salary': (42000, 110000), 'json': ''},
    'X34': {'name': 'Zanzibar', 'flag': '🇹🇿', 'locale': 'en_US', 'symbol': 'TSh', 'salary': (1200000, 5200000), 'json': ''},
    'YE2': {'name': 'Yemen (South)', 'flag': '🇾🇪', 'locale': 'en_US', 'symbol': '﷼', 'salary': (520000, 2200000), 'json': 'sheerid_ye2.json'},
    'ZM2': {'name': 'Zambia Copperbelt', 'flag': '🇿🇲', 'locale': 'en_US', 'symbol': 'ZK', 'salary': (6000, 25000), 'json': 'sheerid_zm2.json'},
    'ZW2': {'name': 'Zimbabwe Midlands', 'flag': '🇿🇼', 'locale': 'en_US', 'symbol': '$', 'salary': (400, 1700), 'json': 'sheerid_zw2.json'},
}

EXPECTED_COUNTRY_COUNT = 223
COUNTRIES = {**COUNTRIES, **{k: v for k, v in EXTRA_COUNTRIES.items() if k not in COUNTRIES}}
COUNTRY_COUNT = len(COUNTRIES)

COUNTRY_PAGE_SIZE = 25
SORTED_COUNTRY_ITEMS = sorted(COUNTRIES.items(), key=lambda kv: kv[1]['name'])


def country_page_title(doc_prefix: str, page: int) -> str:
    total_pages = max(1, math.ceil(COUNTRY_COUNT / COUNTRY_PAGE_SIZE))
    base_title = "👨‍🏫 SELECT COUNTRY:" if doc_prefix == 'tc_' else "🎓 SELECT COUNTRY:"
    return f"{base_title}\nPage {page + 1}/{total_pages} • {COUNTRY_COUNT} total"


def build_country_keyboard(doc_prefix: str, page: int = 0, include_back: bool = True):
    start = page * COUNTRY_PAGE_SIZE
    end = start + COUNTRY_PAGE_SIZE
    page_items = SORTED_COUNTRY_ITEMS[start:end]

    keyboard = [
        [InlineKeyboardButton(f"{cfg['flag']} {cfg['name']}", callback_data=f"{doc_prefix}{code}")]
        for code, cfg in page_items
    ]

    nav_row = []
    if start > 0:
        nav_row.append(InlineKeyboardButton("⬅️ Prev", callback_data=f"page_{doc_prefix}{page - 1}"))
    if end < COUNTRY_COUNT:
        nav_row.append(InlineKeyboardButton("➡️ Next", callback_data=f"page_{doc_prefix}{page + 1}"))
    if nav_row:
        keyboard.append(nav_row)

    if include_back:
        keyboard.append([InlineKeyboardButton("🔙 Back", callback_data='back')])

    return keyboard

if COUNTRY_COUNT != EXPECTED_COUNTRY_COUNT:
    logger.warning(
        f"🌍 Country catalog has {COUNTRY_COUNT} entries (expected {EXPECTED_COUNTRY_COUNT}); "
        "verify EXTRA_COUNTRIES for missing or duplicate codes."
    )

def init_db():
    conn = sqlite3.connect('bot.db')
    c = conn.cursor()
    # Create table with memory columns
    c.execute('''CREATE TABLE IF NOT EXISTS authorized_users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        added_by INTEGER,
        added_at TEXT,
        is_active INTEGER DEFAULT 1,
        last_country TEXT,
        last_doc_type TEXT,
        is_super_admin INTEGER DEFAULT 0
    )''')
    
    # Add columns if they don't exist (for existing databases)
    try:
        c.execute('ALTER TABLE authorized_users ADD COLUMN last_country TEXT')
    except:
        pass
    try:
        c.execute('ALTER TABLE authorized_users ADD COLUMN last_doc_type TEXT')
    except:
        pass
    try:
        c.execute('ALTER TABLE authorized_users ADD COLUMN is_super_admin INTEGER DEFAULT 0')
    except:
        pass
    
    conn.commit()
    conn.close()
    
    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute('INSERT OR REPLACE INTO authorized_users (user_id, username, first_name, added_by, added_at, is_active, is_super_admin) VALUES (?, ?, ?, ?, ?, ?, 1)',
                  (SUPER_ADMIN_ID, 'Adeebaabkhan', 'Adeebaabkhan', 0, datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S'), 1))
        conn.commit()
        conn.close()
    except:
        pass

init_db()

MAIN_MENU, SELECT_DOC, SELECT_COUNTRY, INPUT_SCHOOL, INPUT_TEACHER_DETAILS, INPUT_QTY, STUDENT_SELECT_COLLEGE, ADD_USER_INPUT = range(8)

def now():
    return datetime.now(timezone.utc)


def extract_body_text(msg):
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition") or "").lower()
            if content_type == "text/plain" and "attachment" not in disposition:
                charset = part.get_content_charset() or "utf-8"
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode(charset, errors="ignore")
    else:
        charset = msg.get_content_charset() or "utf-8"
        payload = msg.get_payload(decode=True)
        if payload:
            return payload.decode(charset, errors="ignore")
    return ""


def fetch_airwallex_otp():
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise RuntimeError("Gmail credentials are not configured")

    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    try:
        mail.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        status, _ = mail.select("INBOX")
        if status != "OK":
            raise RuntimeError("Could not open INBOX")

        status, data = mail.search(None, f'(FROM "{AIRWALLEX_SENDER}")')
        if status != "OK":
            raise RuntimeError("Search failed")

        ids = data[0].split()
        if not ids:
            raise RuntimeError("No Airwallex emails found")

        latest_id = ids[-1]
        status, msg_data = mail.fetch(latest_id, "(RFC822)")
        if status != "OK" or not msg_data:
            raise RuntimeError("Failed to fetch latest Airwallex email")

        raw_email = msg_data[0][1]
        msg = message_from_bytes(raw_email)
        subject = msg.get("Subject", "")
        body_text = extract_body_text(msg)

        otp_match = re.search(r"\b(\d{6})\b", subject) or re.search(r"\b(\d{6})\b", body_text)
        if not otp_match:
            raise RuntimeError("OTP code not found in latest email")

        sent_at = parsedate_to_datetime(msg.get("Date")) if msg.get("Date") else None
        return otp_match.group(1), subject, sent_at
    finally:
        try:
            mail.logout()
        except Exception:
            pass

def is_super_admin(uid):
    if int(uid) in ADMIN_IDS:
        return True

    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute('SELECT is_super_admin FROM authorized_users WHERE user_id = ?', (uid,))
        result = c.fetchone()
        conn.close()
        return result and result[0] == 1
    except Exception as e:
        logger.error(f"❌ Failed to read super admin status for {uid}: {e}")
        return False

def is_authorized(uid):
    if is_super_admin(uid):
        return True
    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute('SELECT is_active FROM authorized_users WHERE user_id = ?', (uid,))
        result = c.fetchone()
        conn.close()
        return result and result[0] == 1
    except:
        return False

def get_authorized_user(user_id):
    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute(
            'SELECT user_id, username, first_name, added_by, added_at, is_active FROM authorized_users WHERE user_id = ?',
            (user_id,),
        )
        row = c.fetchone()
        conn.close()

        if not row:
            return None

        return {
            'user_id': row[0],
            'username': row[1],
            'first_name': row[2],
            'added_by': row[3],
            'added_at': row[4],
            'is_active': row[5],
        }
    except Exception as e:
        logger.error(f"❌ Failed to fetch user {user_id}: {e}")
        return None

def add_authorized_user(user_id, username=None, first_name=None, added_by=None):
    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute(
            'SELECT user_id, username, first_name, added_by, added_at, is_active, is_super_admin FROM authorized_users WHERE user_id = ?',
            (user_id,),
        )
        row = c.fetchone()
        conn.close()

        if not row:
            return None

        return {
            'user_id': row[0],
            'username': row[1],
            'first_name': row[2],
            'added_by': row[3],
            'added_at': row[4],
            'is_active': row[5],
            'is_super_admin': row[6],
        }
    except Exception as e:
        logger.error(f"❌ Failed to fetch user {user_id}: {e}")
        return None

def add_authorized_user(user_id, username=None, first_name=None, added_by=None, is_super_admin=False):
    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute(
            'INSERT OR REPLACE INTO authorized_users (user_id, username, first_name, added_by, added_at, is_active, is_super_admin) VALUES (?, ?, ?, ?, ?, 1, ?)',
            (
                int(user_id),
                username or '',
                first_name or '',
                added_by or 0,
                now().strftime('%Y-%m-%d %H:%M:%S'),
                1 if is_super_admin else 0,
            ),
        )
        conn.commit()
        conn.close()
        logger.info(f"✅ Added/updated authorized user {user_id}")
        if is_super_admin:
            ADMIN_IDS.add(int(user_id))
        return True
    except Exception as e:
        logger.error(f"❌ Failed to add user {user_id}: {e}")
        return False


def add_super_admin(user_id, username=None, first_name=None, added_by=None):
    return add_authorized_user(
        user_id,
        username=username,
        first_name=first_name,
        added_by=added_by,
        is_super_admin=True,
    )

def get_last_country(uid):
    """Get user's last used country"""
    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute('SELECT last_country, last_doc_type FROM authorized_users WHERE user_id = ?', (uid,))
        result = c.fetchone()
        conn.close()
        if result and result[0]:
            return result[0], result[1]
        return None, None
    except:
        return None, None

def save_last_country(uid, country_code, doc_type):
    """Save user's last used country"""
    try:
        conn = sqlite3.connect('bot.db')
        c = conn.cursor()
        c.execute('UPDATE authorized_users SET last_country = ?, last_doc_type = ? WHERE user_id = ?', 
                  (country_code, doc_type, uid))
        conn.commit()
        conn.close()
        logger.info(f"✅ Saved country {country_code} for user {uid}")
    except Exception as e:
        logger.error(f"❌ Failed to save country: {e}")

def get_font(size=14, bold=False):
    try:
        if os.name == 'nt':
            return ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", size)
        for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    except:
        pass
    return ImageFont.load_default()


def upscale_image(img, target_width=3840):
    """Upscale images to the target width for sharper output (defaults to ~4K)."""
    if img.width >= target_width:
        return img
    ratio = target_width / float(img.width)
    new_size = (int(img.width * ratio), int(img.height * ratio))
    return img.resize(new_size, Image.Resampling.LANCZOS)


def load_logo_image(size=100, fallback_text="TG"):
    """Load a custom logo from LOGO_PATH or draw a branded fallback."""
    if LOGO_PATH and os.path.isfile(LOGO_PATH):
        try:
            logo = Image.open(LOGO_PATH).convert("RGBA")
            logo.thumbnail((size, size), Image.Resampling.LANCZOS)
            return logo
        except Exception as exc:
            logger.warning(f"⚠️ Failed to load logo {LOGO_PATH}: {exc}")

    logo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(logo)
    draw.ellipse([(0, 0), (size, size)], fill=BLUE)
    draw.text(
        (size // 2, size // 2),
        fallback_text[:3].upper(),
        fill=WHITE,
        font=get_font(size // 2, True),
        anchor="mm",
    )
    return logo

def download_real_photo(student_id):
    providers = [
        (
            "tpdne",
            lambda sid: f"https://thispersondoesnotexist.com/?t={int(time.time())}&r={random.randint(1000, 9999)}&s={sid}",
        ),
        (
            "picsum",
            lambda sid: f"https://picsum.photos/seed/{sid}/800/1000",
        ),
        (
            "randomuser",
            lambda sid: f"https://randomuser.me/api/portraits/{random.choice(['men', 'women'])}/{random.randint(0, 99)}.jpg",
        ),
    ]

    max_attempts = len(providers) * 2
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'image/*'}

    for attempt in range(max_attempts):
        source, build_url = providers[attempt % len(providers)]
        try:
            url = build_url(student_id)
            response = http.get(url, timeout=20, headers=headers, stream=True)
            response.raise_for_status()
            photo = Image.open(BytesIO(response.content))
            photo = photo.convert("RGB")
            logger.info(f"✅ Real photo downloaded from {source}: {student_id}")
            return photo
        except Exception as e:
            logger.warning(f"⚠️ Photo attempt {attempt + 1}/{max_attempts} ({source}) failed: {e}")
            time.sleep(1)

    logger.warning(f"⚠️ Using placeholder for: {student_id}")
    return create_photo_placeholder(student_id)

def create_photo_placeholder(student_id):
    photo = Image.new("RGB", (160, 210), WHITE)
    draw = ImageDraw.Draw(photo)
    draw.rectangle([(0, 0), (160, 210)], outline=BLUE, width=2, fill=LIGHT_GRAY)
    draw.rectangle([(0, 0), (160, 50)], fill=BLUE)
    draw.text((80, 25), "NO PHOTO", fill=WHITE, font=get_font(12, True), anchor="mm")
    draw.text((80, 105), "ID", fill=BLUE, font=get_font(20, True), anchor="mm")
    draw.text((80, 140), student_id[:10], fill=BLACK, font=get_font(9), anchor="mm")
    return photo

def generate_qr_code(student_data, college_data, country_code):
    try:
        program = student_data.get('program') or student_data.get('role') or 'General Studies'
        qr_data = (
            f"TYPE:STUDENT_ID\n"
            f"NAME:{student_data.get('name', 'N/A')}\n"
            f"ID:{student_data.get('id', 'N/A')}\n"
            f"COLLEGE:{college_data.get('name', 'N/A')}\n"
            f"PROGRAM:{program}\n"
            f"COUNTRY:{country_code}\n"
            f"ISSUED:{now().strftime('%Y-%m-%d')}\n"
            f"VALID:{(now() + timedelta(days=1460)).strftime('%Y-%m-%d')}"
        )
        qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=6, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color=BLUE, back_color=WHITE).convert("RGB")
        logger.info(f"✅ QR code generated")
        return qr_img
    except Exception as e:
        logger.error(f"❌ QR Code error: {e}")
        placeholder = Image.new("RGB", (90, 90), WHITE)
        draw = ImageDraw.Draw(placeholder)
        draw.rectangle([(0, 0), (89, 89)], outline=BLUE, width=2)
        draw.text((45, 45), "QR", fill=BLUE, font=get_font(12, True), anchor="mm")
        return placeholder

def generate_random_teacher_id():
    year = datetime.now().year % 100
    code = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=2))
    number = random.randint(10000, 99999)
    return f"TCH{year}{code}{number}"

def generate_random_student_id():
    year = datetime.now().year % 100
    number = random.randint(100000, 999999)
    return f"STU{year}{number}"

def generate_random_profession():
    return random.choice(TEACHER_PROFESSIONS)

def generate_random_program():
    programs = ['Bachelor of Science in Computer Science', 'Bachelor of Science in Mathematics', 'Bachelor of Arts in History', 'Bachelor of Science in Physics', 'Bachelor of Science in Chemistry', 'Bachelor of Science in Biology', 'Bachelor of Commerce', 'Bachelor of Engineering', 'Master of Business Administration', 'Master of Science in IT']
    return random.choice(programs)

def load_colleges(code):
    try:
        jfile = COUNTRIES[code]['json']
        if not os.path.exists(jfile):
            return []
        with open(jfile, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return [{'name': str(c['name']), 'id': str(c['id'])} for c in data if c.get('name') and c.get('id') and c.get('type') in ['UNIVERSITY', 'COLLEGE', 'HEI', 'POST_SECONDARY']]
    except:
        return []

# ============================================================
# SALARY RECEIPT GENERATION
# ============================================================
def gen_salary_receipt_auto(
    school_name,
    teacher_name,
    teacher_id,
    profession,
    school_address,
    school_contact,
    school_email,
    admin_name,
    admin_title,
    start_date,
    subject,
    employment_type,
    academic_year,
    school_website,
    country_code='IN',
    issue_date=None,
):
    cfg = COUNTRIES.get(country_code, COUNTRIES['IN'])
    fake = Faker(cfg['locale'])
    width, height = 900, 1050
    img = Image.new('RGB', (width, height), WHITE)
    d = ImageDraw.Draw(img)
    issued = issue_date or datetime.now()
    period_length = random.randint(14, 30)
    max_period_window = datetime.now() - timedelta(days=90)
    period_start = issued - timedelta(days=period_length)
    if period_start < max_period_window:
        period_start = max_period_window
    period_end = issued
    base_salary = random.randint(*cfg['salary'])
    allowances = int(base_salary * random.uniform(0.05, 0.15))
    bonus = random.randint(500, 1500)
    overtime = random.randint(100, 600)
    tax = int(base_salary * 0.08)
    deductions = random.randint(100, 400)
    insurance = random.randint(100, 300)
    net_salary = base_salary + allowances + bonus + overtime - tax - deductions - insurance

    margin = 40
    d.rectangle([(margin - 12, margin - 20), (width - margin + 12, height - margin + 20)], outline=BORDER_GRAY, width=2)

    d.text((margin, margin - 6), school_name.upper(), fill=BLACK, font=get_font(24, True))
    d.text((margin, margin + 26), f"Payroll statement • {cfg['flag']} {cfg['name']}", fill=DARK_GRAY, font=get_font(12))
    d.text((width - margin, margin - 6), "PAYSLIP", fill=BLACK, font=get_font(20, True), anchor='rt')
    d.text((width - margin, margin + 18), issued.strftime('%d %B %Y'), fill=DARK_GRAY, font=get_font(12), anchor='rt')

    header_y = margin + 60
    d.line([(margin, header_y), (width - margin, header_y)], fill=BORDER_GRAY, width=1)

    info_y = header_y + 18
    d.text((margin, info_y), f"Employee: {teacher_name}", fill=BLACK, font=get_font(13))
    d.text((margin, info_y + 24), f"Employee ID: {teacher_id}", fill=BLACK, font=get_font(13))
    d.text((margin, info_y + 48), f"Role: {profession}", fill=BLACK, font=get_font(13))
    d.text((width - margin, info_y), f"Pay period: {period_start:%d %b %Y} - {period_end:%d %b %Y}", fill=BLACK, font=get_font(13), anchor='rt')
    d.text((width - margin, info_y + 24), f"Slip #: {random.randint(100000, 999999)}", fill=DARK_GRAY, font=get_font(12), anchor='rt')
    d.text((width - margin, info_y + 48), f"Status: PAID", fill=BLACK, font=get_font(12, True), anchor='rt')

    section_top = info_y + 82
    d.line([(margin, section_top), (width - margin, section_top)], fill=BORDER_GRAY, width=1)
    d.text((margin, section_top + 10), "School", fill=DARK_GRAY, font=get_font(12, True))
    d.text((margin, section_top + 28), school_name, fill=BLACK, font=get_font(13))
    d.text((margin, section_top + 48), school_address, fill=BLACK, font=get_font(13))
    d.text((margin, section_top + 68), f"Contact: {school_contact}", fill=BLACK, font=get_font(13))
    d.text((margin, section_top + 88), f"Email: {school_email}", fill=BLACK, font=get_font(13))
    d.text((width - margin, section_top + 28), f"Website: {school_website}", fill=DARK_GRAY, font=get_font(12), anchor='rt')
    d.text((width - margin, section_top + 48), f"Employment: {employment_type}", fill=DARK_GRAY, font=get_font(12), anchor='rt')
    d.text((width - margin, section_top + 68), f"Academic year: {academic_year}", fill=DARK_GRAY, font=get_font(12), anchor='rt')

    payroll_top = section_top + 120
    d.line([(margin, payroll_top), (width - margin, payroll_top)], fill=BORDER_GRAY, width=1)
    d.text((margin, payroll_top + 10), "EARNINGS", fill=BLACK, font=get_font(13, True))
    d.text((width // 2 + 10, payroll_top + 10), "DEDUCTIONS", fill=BLACK, font=get_font(13, True))

    line_y = payroll_top + 36
    earnings = [
        ("Base salary", base_salary),
        ("Allowances", allowances),
        ("Bonus", bonus),
        ("Overtime", overtime),
    ]
    for label, amount in earnings:
        d.text((margin, line_y), label, fill=BLACK, font=get_font(12))
        d.text((width // 2 - 20, line_y), f"{cfg['symbol']}{amount:,}", fill=BLACK, font=get_font(12, True), anchor='rt')
        line_y += 26

    line_y = payroll_top + 36
    deductions_list = [
        ("Tax (8%)", tax),
        ("Retirement/Pension", deductions),
        ("Health insurance", insurance),
    ]
    for label, amount in deductions_list:
        d.text((width // 2 + 10, line_y), label, fill=BLACK, font=get_font(12))
        d.text((width - margin, line_y), f"-{cfg['symbol']}{amount:,}", fill=BLACK, font=get_font(12, True), anchor='rt')
        line_y += 26

    summary_top = payroll_top + 140
    d.line([(margin, summary_top), (width - margin, summary_top)], fill=BORDER_GRAY, width=1)
    gross = base_salary + allowances + bonus + overtime
    total_deductions = tax + deductions + insurance
    d.text((margin, summary_top + 12), f"Gross earnings: {cfg['symbol']}{gross:,}", fill=BLACK, font=get_font(13, True))
    d.text((margin, summary_top + 36), f"Total deductions: {cfg['symbol']}{total_deductions:,}", fill=BLACK, font=get_font(13, True))
    d.text((margin, summary_top + 60), f"Net salary: {cfg['symbol']}{net_salary:,}", fill=BLUE, font=get_font(14, True))

    confirm_top = summary_top + 96
    d.line([(margin, confirm_top), (width - margin, confirm_top)], fill=BORDER_GRAY, width=1)
    d.text((margin, confirm_top + 10), "Employment confirmation", fill=BLACK, font=get_font(12, True))
    d.text((margin, confirm_top + 32), f"Current role: {profession} (ID {teacher_id})", fill=BLACK, font=get_font(12))
    d.text((margin, confirm_top + 52), f"Subjects: {subject}", fill=BLACK, font=get_font(12))
    d.text((margin, confirm_top + 72), f"Start date: {start_date} • Academic year: {academic_year}", fill=BLACK, font=get_font(12))
    d.text((margin, confirm_top + 92), f"Employment type: {employment_type}", fill=BLACK, font=get_font(12))
    d.text((width - margin, confirm_top + 32), f"Administrator: {admin_name}", fill=DARK_GRAY, font=get_font(12), anchor='rt')
    d.text((width - margin, confirm_top + 52), f"Title: {admin_title}", fill=DARK_GRAY, font=get_font(12), anchor='rt')
    d.text((width - margin, confirm_top + 72), f"Issued: {issued:%d %b %Y}", fill=DARK_GRAY, font=get_font(12), anchor='rt')

    footer_top = confirm_top + 120
    d.line([(margin, footer_top), (width - margin, footer_top)], fill=BORDER_GRAY, width=1)
    d.text((margin, footer_top + 12), f"Transaction ID: TXN{random.randint(1000000, 9999999)}", fill=DARK_GRAY, font=get_font(11))
    d.text((margin, footer_top + 32), f"Bank reference: REF{random.randint(100000, 999999)}", fill=DARK_GRAY, font=get_font(11))
    d.text((margin, footer_top + 52), f"Account: {fake.iban()} • {fake.bank_country()}", fill=DARK_GRAY, font=get_font(11))
    d.text((margin, footer_top + 72), f"Contact: {school_contact} | {school_email}", fill=DARK_GRAY, font=get_font(11))
    d.text((width - margin, footer_top + 72), school_address, fill=DARK_GRAY, font=get_font(11), anchor='rt')
    d.text((margin, footer_top + 92), "Authorized signature:", fill=DARK_GRAY, font=get_font(11))
    sig_y = footer_top + 120
    d.line([(margin, sig_y), (margin + 220, sig_y)], fill=DARK_GRAY, width=2)
    d.text((margin, sig_y + 6), admin_name, fill=DARK_GRAY, font=get_font(10))
    d.text((margin, sig_y + 22), admin_title, fill=DARK_GRAY, font=get_font(10))
    return upscale_image(img)


# ============================================================
# TEACHER ID CARD GENERATION
# ============================================================
def gen_teacher_id_auto(
    school_name,
    teacher_name,
    teacher_id,
    profession,
    school_address,
    school_contact,
    school_email,
    admin_name,
    admin_title,
    start_date,
    subject,
    employment_type,
    academic_year,
    school_website,
    country_code='IN',
    issue_date=None,
):
    cfg = COUNTRIES.get(country_code, COUNTRIES['IN'])
    width, height = 900, 620
    img = Image.new('RGB', (width, height), WHITE)
    d = ImageDraw.Draw(img)

    margin = 32
    d.rectangle([(margin, margin), (width - margin, height - margin)], outline=BORDER_GRAY, width=2)

    issued = issue_date or datetime.now()
    expiry = issued + timedelta(days=365 * 4)

    d.text((margin + 12, margin + 8), school_name.upper(), fill=BLACK, font=get_font(24, True))
    d.text((margin + 12, margin + 38), f"{cfg['flag']} {cfg['name']}", fill=DARK_GRAY, font=get_font(12))
    d.text((width - margin - 12, margin + 8), "FACULTY ID", fill=BLACK, font=get_font(18, True), anchor='rt')
    d.text((width - margin - 12, margin + 30), "Official credential", fill=DARK_GRAY, font=get_font(11), anchor='rt')

    photo = download_real_photo(teacher_id).resize((210, 250), Image.Resampling.LANCZOS)
    photo_x, photo_y = margin + 12, margin + 70
    d.rectangle([(photo_x - 4, photo_y - 4), (photo_x + 210 + 4, photo_y + 250 + 4)], outline=BORDER_GRAY, width=2)
    img.paste(photo, (photo_x, photo_y))

    d.text((photo_x, photo_y + 262), teacher_name.upper(), fill=BLACK, font=get_font(18, True))
    d.text((photo_x, photo_y + 288), profession, fill=DARK_GRAY, font=get_font(13))
    d.text((photo_x, photo_y + 312), f"Faculty ID: {teacher_id}", fill=BLUE, font=get_font(12, True))

    detail_x = photo_x + 250
    detail_y = photo_y
    line_gap = 30
    fields_left = [
        ("School", school_name),
        ("Address", school_address),
        ("Contact", f"{school_contact} | {school_email}"),
        ("Website", school_website),
    ]
    for idx, (label, value) in enumerate(fields_left):
        y = detail_y + idx * line_gap
        d.text((detail_x, y), label, fill=DARK_GRAY, font=get_font(11, True))
        d.text((detail_x, y + 16), value, fill=BLACK, font=get_font(12))

    fields_right = [
        ("Start", start_date),
        ("Academic year", academic_year),
        ("Employment", employment_type),
        ("Subjects", subject),
        ("Valid until", expiry.strftime('%d %b %Y')),
    ]
    for idx, (label, value) in enumerate(fields_right):
        y = detail_y + idx * line_gap
        d.text((width - margin - 230, y), label, fill=DARK_GRAY, font=get_font(11, True))
        d.text((width - margin - 230, y + 16), value, fill=BLACK, font=get_font(12))

    auth_y = detail_y + line_gap * 6
    d.line([(margin, auth_y), (width - margin, auth_y)], fill=BORDER_GRAY, width=1)
    d.text((margin + 12, auth_y + 12), f"Employment confirmed: {teacher_name} ({teacher_id})", fill=BLACK, font=get_font(12))
    d.text((margin + 12, auth_y + 32), f"Admin: {admin_name} • {admin_title}", fill=DARK_GRAY, font=get_font(11))
    d.text((margin + 12, auth_y + 52), f"Issued: {issued:%d %b %Y}", fill=DARK_GRAY, font=get_font(11))

    try:
        qr_payload = {'name': teacher_name, 'id': teacher_id, 'role': profession}
        qr_img = generate_qr_code(qr_payload, {'name': school_name, 'id': teacher_id}, country_code)
        qr_size = 110
        qr = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
        qr_x = width - margin - qr_size - 14
        qr_y = auth_y + 10
        d.rectangle([(qr_x - 4, qr_y - 4), (qr_x + qr_size + 4, qr_y + qr_size + 4)], outline=BORDER_GRAY, width=2)
        img.paste(qr, (qr_x, qr_y))
    except Exception as e:
        logger.error(f"❌ QR error: {e}")

    sig_y = height - margin - 70
    d.line([(margin + 12, sig_y), (margin + 220, sig_y)], fill=DARK_GRAY, width=2)
    d.text((margin + 12, sig_y + 6), admin_name, fill=DARK_GRAY, font=get_font(10, True))
    d.text((margin + 12, sig_y + 22), admin_title, fill=DARK_GRAY, font=get_font(10))
    d.text((width - margin - 12, sig_y + 6), f"Valid {issued:%Y} - {expiry:%Y}", fill=DARK_GRAY, font=get_font(10), anchor='rt')
    return upscale_image(img)
# ============================================================
# STUDENT ID CARD GENERATION
# ============================================================
def gen_student_id_auto(school_name, student_name, student_id, program, country_code='IN'):
    cfg = COUNTRIES.get(country_code, COUNTRIES['IN'])
    fake = Faker(cfg['locale'])
    width, height = 1000, 660
    img = Image.new('RGB', (width, height), WHITE)
    d = ImageDraw.Draw(img)

    issued = datetime.now()
    expiry = issued + timedelta(days=365 * 4)
    birthdate = fake.date_between(start_date='-27y', end_date='-18y')
    phone = fake.phone_number()
    address = fake.address().replace('\n', ', ')

    program_label = program or "General Studies"
    abbr = ''.join([w[0] for w in school_name.split()[:3]]).upper()[:3]

    # Header
    header_h = 170
    d.rectangle([(0, 0), (width, height)], fill=LIGHT_GRAY)
    d.rectangle([(0, 0), (width, header_h)], fill=NAVY_BLUE)
    d.rectangle([(0, header_h - 22), (width, header_h)], fill=GOLD)

    logo_size = 110
    logo = load_logo_image(logo_size, fallback_text=abbr or "TG")
    logo_bg = Image.new('RGBA', (logo_size + 16, logo_size + 16), (0, 0, 0, 0))
    logo_bg.paste(logo, (8, 8), logo)
    img.paste(logo_bg, (30, 26), logo_bg)

    d.text((170, 40), school_name.upper(), fill=WHITE, font=get_font(26, True))
    d.text((170, 82), f"{cfg['flag']} {cfg['name']} • Academic Affairs", fill=WHITE, font=get_font(14))
    d.text((width - 36, 40), "STUDENT ID", fill=WHITE, font=get_font(22, True), anchor='rt')
    d.text((width - 36, 78), program_label, fill=WHITE, font=get_font(13), anchor='rt')

    # Card body
    body_top = header_h + 16
    card_height = 430
    d.rounded_rectangle([(24, body_top), (width - 24, body_top + card_height)], radius=18, fill=WHITE, outline=BORDER_GRAY, width=2)

    photo = download_real_photo(student_id).resize((230, 270), Image.Resampling.LANCZOS)
    photo_x, photo_y = 48, body_top + 36
    frame = [(photo_x - 10, photo_y - 10), (photo_x + 230 + 10, photo_y + 270 + 10)]
    d.rounded_rectangle(frame, radius=18, fill=LIGHT_GRAY, outline=BLUE, width=3)
    img.paste(photo, (photo_x, photo_y))

    # Identity block
    name_y = photo_y - 6
    d.text((320, name_y), student_name.upper(), fill=BLACK, font=get_font(30, True))
    d.text((320, name_y + 34), program_label, fill=DARK_GRAY, font=get_font(16))
    d.text((320, name_y + 62), f"Student ID: {student_id}", fill=BLUE, font=get_font(14, True))
    d.text((320, name_y + 88), "Official Enrollment Credential", fill=GREEN, font=get_font(12, True))

    # Details panel
    info_top = name_y + 126
    d.rounded_rectangle([(300, info_top - 10), (width - 46, info_top + 210)], radius=14, fill=LIGHT_GRAY, outline=BORDER_GRAY, width=1)

    left_x = 320
    right_x = 620
    line_gap = 40
    fields_left = [
        ("Program", program_label),
        ("Phone", phone),
        ("DOB", birthdate.strftime('%d %B %Y')),
    ]
    for idx, (label, value) in enumerate(fields_left):
        y = info_top + idx * line_gap
        d.text((left_x, y), label, fill=DARK_GRAY, font=get_font(12, True))
        d.text((left_x, y + 18), value, fill=BLACK, font=get_font(13))

    fields_right = [
        ("Student ID", student_id),
        ("Address", address),
        ("Issued / Valid", f"{issued.strftime('%d %b %Y')} → {expiry.strftime('%d %b %Y')}")
    ]
    for idx, (label, value) in enumerate(fields_right):
        y = info_top + idx * line_gap
        d.text((right_x, y), label, fill=DARK_GRAY, font=get_font(12, True))
        d.text((right_x, y + 18), value, fill=BLACK, font=get_font(13))

    # QR + authenticity
    qr_block_top = info_top + 200
    qr_note = f"Issued: {issued.strftime('%d %b %Y %H:%M UTC')}"
    d.text((320, qr_block_top + 12), "Status: Enrolled • Verified", fill=GREEN, font=get_font(12, True))
    d.text((320, qr_block_top + 36), qr_note, fill=DARK_GRAY, font=get_font(11))
    d.text((320, qr_block_top + 56), f"Registrar: {school_name}", fill=DARK_GRAY, font=get_font(11))

    try:
        qr_payload = {'name': student_name, 'id': student_id, 'program': program_label}
        qr_img = generate_qr_code(qr_payload, {'name': school_name, 'id': student_id}, country_code)
        qr_size = 120
        qr = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
        qr_x = width - qr_size - 70
        qr_y = qr_block_top
        d.rounded_rectangle([(qr_x - 10, qr_y - 10), (qr_x + qr_size + 10, qr_y + qr_size + 10)], radius=16, fill=WHITE, outline=BLUE, width=2)
        img.paste(qr, (qr_x, qr_y))
    except Exception as e:
        logger.error(f"❌ QR error: {e}")

    # Footer
    footer_y = height - 70
    d.rectangle([(0, footer_y), (width, height)], fill=NAVY_BLUE)
    d.text((30, footer_y + 18), "Official Student Identification", fill=WHITE, font=get_font(12, True))
    d.text((width - 30, footer_y + 18), f"Valid {issued.strftime('%Y')} - {expiry.strftime('%Y')}", fill=WHITE, font=get_font(11), anchor='rt')
    d.text((30, footer_y + 42), "Contact registrar for verification", fill=WHITE, font=get_font(11))
    return upscale_image(img)


# ============================================================
# BOT HANDLERS WITH MEMORY & TAP-TO-COPY
# ============================================================
def quantity_keyboard():
    choices = [5, 10, 20, 30]
    rows = [
        [InlineKeyboardButton(f"{choices[0]}", callback_data=f"qty_{choices[0]}")],
        [InlineKeyboardButton(f"{choices[1]}", callback_data=f"qty_{choices[1]}")],
        [InlineKeyboardButton(f"{choices[2]}", callback_data=f"qty_{choices[2]}")],
        [InlineKeyboardButton(f"{choices[3]}", callback_data=f"qty_{choices[3]}")],
        [InlineKeyboardButton("🔢 Custom 1-50", callback_data='qty_custom')],
    ]
    return InlineKeyboardMarkup(rows)

def send_main_menu(context: CallbackContext, chat, uid: int, name: str):
    keyboard = []

    if is_super_admin(uid):
        keyboard.append(
            [
                InlineKeyboardButton("➕ Add User", callback_data='add_user'),
                InlineKeyboardButton("🛡️ Add Super Admin", callback_data='add_super_admin'),
            ]
        )

    keyboard.extend(
        [
            [InlineKeyboardButton("👨‍🏫 Teachers", callback_data='teacher')],
            [InlineKeyboardButton("🎓 Students", callback_data='student')],
            [InlineKeyboardButton("ℹ️ Info", callback_data='info')],
        ]
    )
    role = "🔴 SUPER ADMIN" if is_super_admin(uid) else "🟢 User"
    text = (
        f"✅ Welcome {name}\nRole: {role}\n\n"
        f"🤖 {COUNTRY_COUNT} COUNTRIES BOT\n📸 Real Photos + QR Codes\n🧠 Smart Memory\n📋 Tap-to-Copy Names\n\n"
        f"📅 {now().strftime('%Y-%m-%d %H:%M:%S')}\n👤 Adeebaabkhan"
    )

    if chat:
        chat.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        context.bot.send_message(chat_id=uid, text=text, reply_markup=InlineKeyboardMarkup(keyboard))
    return MAIN_MENU


def start(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    name = update.effective_user.first_name or "User"
    message = update.message
    if not message and update.callback_query:
        message = update.callback_query.message

    if not is_authorized(uid):
        if message:
            message.reply_text("❌ ACCESS DENIED\n\nContact: @itsmeaab")
        else:
            context.bot.send_message(chat_id=uid, text="❌ ACCESS DENIED\n\nContact: @itsmeaab")
        return ConversationHandler.END

    return send_main_menu(context, message, uid, name)


def prompt_teacher_country(send_func, uid: int, context: CallbackContext):
    last_country, last_doc_type = get_last_country(uid)
    context.user_data['type'] = 'teacher'

    if last_country and last_country in COUNTRIES and last_doc_type == 'teacher':
        cfg = COUNTRIES[last_country]
        keyboard = [
            [InlineKeyboardButton("✅ YES", callback_data=f'use_last_tc_{last_country}')],
            [InlineKeyboardButton("❌ NO", callback_data='choose_new_teacher')]
        ]
        send_func(
            f"👨‍🏫 TEACHER DOCUMENTS\n\n"
            f"Use {cfg['flag']} `{cfg['name']}` again?\n\n"
            f"💡 Tap name to copy",
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode='Markdown',
        )
    else:
        keyboard = build_country_keyboard('tc_', 0)
        send_func(
            country_page_title('tc_', 0),
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

    return SELECT_COUNTRY


def teacher_command(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    message = update.effective_message

    if not is_authorized(uid):
        message.reply_text("❌ ACCESS DENIED\n\nContact: @itsmeaab")
        return ConversationHandler.END

    return prompt_teacher_country(message.reply_text, uid, context)

def add_user_command(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    if not is_super_admin(uid):
        update.message.reply_text("❌ Only the super admin can add users")
        return

    if not context.args:
        update.message.reply_text("Usage: /adduser <user_id> [username] [first name]")
        return

    try:
        target_id = int(context.args[0])
    except ValueError:
        update.message.reply_text("❌ user_id must be a number")
        return

    username = context.args[1].lstrip('@') if len(context.args) > 1 else None
    first_name = ' '.join(context.args[2:]) if len(context.args) > 2 else None

    existing = get_authorized_user(target_id)
    label = username or first_name or str(target_id)

    if add_authorized_user(target_id, username=username, first_name=first_name, added_by=uid):
        if existing:
            status = "reactivated" if existing.get('is_active') == 0 else "updated"
            update.message.reply_text(f"✅ {label} {status} and authorized")
        else:
            update.message.reply_text(f"✅ Added {label} to authorized users")
    else:
        update.message.reply_text("❌ Could not save user. Check logs for details.")


def add_super_admin_command(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    if not is_super_admin(uid):
        update.message.reply_text("❌ Only the super admin can promote users")
        return

    if not context.args:
        update.message.reply_text("Usage: /addsuper <user_id> [username] [first name]")
        return

    try:
        target_id = int(context.args[0])
    except ValueError:
        update.message.reply_text("❌ user_id must be a number")
        return

    username = context.args[1].lstrip('@') if len(context.args) > 1 else None
    first_name = ' '.join(context.args[2:]) if len(context.args) > 2 else None

    existing = get_authorized_user(target_id)
    label = username or first_name or str(target_id)

    if add_super_admin(target_id, username=username, first_name=first_name, added_by=uid):
        if existing:
            status = "promoted to super admin" if not existing.get('is_super_admin') else "already a super admin"
            update.message.reply_text(f"✅ {label} {status}")
        else:
            update.message.reply_text(f"✅ Added {label} as a super admin")
    else:
        update.message.reply_text("❌ Could not promote user. Check logs for details.")


def list_countries_command(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    if not is_authorized(uid):
        update.message.reply_text("❌ ACCESS DENIED\n\nContact: @itsmeaab")
        return

    lines = [f"{code}: {cfg['flag']} {cfg['name']}" for code, cfg in sorted(COUNTRIES.items())]
    header = f"🌍 {COUNTRY_COUNT} countries available:\n"
    chunks = []
    current = header
    for line in lines:
        if len(current) + len(line) + 1 > 3800:
            chunks.append(current.rstrip())
            current = line
        else:
            current += ("" if current.endswith("\n") else "\n") + line
    if current:
        chunks.append(current.rstrip())

    for chunk in chunks:
        update.message.reply_text(chunk)


def airwallex_otp_command(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    message = update.effective_message

    try:
        otp, subject, sent_at = fetch_airwallex_otp()
        date_text = sent_at.strftime('%Y-%m-%d %H:%M:%S %Z') if sent_at else "Unknown time"
        message.reply_text(
            "🔐 Latest Airwallex OTP\n\n"
            f"From: {AIRWALLEX_SENDER}\n"
            f"Subject: {subject}\n"
            f"Date: {date_text}\n\n"
            f"OTP: `{otp}`",
            parse_mode='Markdown'
        )
    except Exception as exc:
        logger.error(f"❌ OTP fetch failed: {exc}")
        message.reply_text(f"❌ Failed to fetch Airwallex OTP: {exc}")


def add_user_inline_input(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    if not is_super_admin(uid):
        update.message.reply_text("❌ Only the super admin can add users")
        return ADD_USER_INPUT

def add_super_admin_command(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    if not is_super_admin(uid):
        update.message.reply_text("❌ Only the super admin can promote users")
        return

    if not context.args:
        update.message.reply_text("Usage: /addsuper <user_id> [username] [first name]")
        return

    try:
        target_id = int(context.args[0])
    except ValueError:
        update.message.reply_text("❌ user_id must be a number")
        return

    username = context.args[1].lstrip('@') if len(context.args) > 1 else None
    first_name = ' '.join(context.args[2:]) if len(context.args) > 2 else None

    existing = get_authorized_user(target_id)
    label = username or first_name or str(target_id)

    if add_super_admin(target_id, username=username, first_name=first_name, added_by=uid):
        if existing:
            status = "promoted to super admin" if not existing.get('is_super_admin') else "already a super admin"
            update.message.reply_text(f"✅ {label} {status}")
        else:
            update.message.reply_text(f"✅ Added {label} as a super admin")
    else:
        update.message.reply_text("❌ Could not promote user. Check logs for details.")

def add_user_inline_input(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    if not is_super_admin(uid):
        update.message.reply_text("❌ Only the super admin can add users")
        return ADD_USER_INPUT

    parts = update.message.text.split()
    if not parts:
        update.message.reply_text("Usage: user_id [username] [first name]\n\n/cancel")
        return ADD_USER_INPUT

    try:
        target_id = int(parts[0])
    except ValueError:
        update.message.reply_text("❌ user_id must be a number\n\n/cancel")
        return ADD_USER_INPUT

    username = parts[1].lstrip('@') if len(parts) > 1 else None
    first_name = ' '.join(parts[2:]) if len(parts) > 2 else None

    existing = get_authorized_user(target_id)
    label = username or first_name or str(target_id)
    mode = context.user_data.get('add_mode', 'user')

    if mode == 'super_admin':
        if add_super_admin(target_id, username=username, first_name=first_name, added_by=uid):
            if existing:
                status = "promoted to super admin" if not existing.get('is_super_admin') else "already a super admin"
                update.message.reply_text(f"✅ {label} {status}")
            else:
                update.message.reply_text(f"✅ Added {label} as a super admin")
        else:
            update.message.reply_text("❌ Could not promote user. Check logs for details.")
    else:
        if add_authorized_user(target_id, username=username, first_name=first_name, added_by=uid):
            if existing:
                status = "reactivated" if existing.get('is_active') == 0 else "updated"
                update.message.reply_text(f"✅ {label} {status} and authorized")
            else:
                update.message.reply_text(f"✅ Added {label} to authorized users")
        else:
            update.message.reply_text("❌ Could not save user. Check logs for details.")

    context.user_data['add_mode'] = 'user'
    return ADD_USER_INPUT

def main_menu(update: Update, context: CallbackContext):
    query = update.callback_query
    query.answer()
    uid = query.from_user.id

    if query.data in ('add_user', 'add_super_admin'):
        if not is_super_admin(uid):
            query.answer("Admins only", show_alert=True)
            return MAIN_MENU

        context.user_data['add_mode'] = 'super_admin' if query.data == 'add_super_admin' else 'user'
        prompt_title = "🛡️ Promote to super admin" if query.data == 'add_super_admin' else "➕ Add a user"

        query.edit_message_text(
            f"{prompt_title}\n\nSend: user_id [username] [first name]\n\n/cancel",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back", callback_data='back')]])
        )
        return ADD_USER_INPUT

    if query.data == 'teacher':
        return prompt_teacher_country(query.edit_message_text, uid, context)
            
    elif query.data == 'student':
        last_country, last_doc_type = get_last_country(uid)
        if last_country and last_country in COUNTRIES and last_doc_type == 'student':
            cfg = COUNTRIES[last_country]
            keyboard = [
                [InlineKeyboardButton("✅ YES", callback_data=f'use_last_sc_{last_country}')],
                [InlineKeyboardButton("❌ NO", callback_data='choose_new_student')]
            ]
            query.edit_message_text(
                f"🎓 STUDENT DOCUMENTS\n\n"
                f"Use {cfg['flag']} `{cfg['name']}` again?\n\n"
                f"💡 Tap name to copy",
                reply_markup=InlineKeyboardMarkup(keyboard),
                parse_mode='Markdown'
            )
            context.user_data['type'] = 'student'
            return SELECT_COUNTRY
        else:
            keyboard = build_country_keyboard('sc_', 0)
            query.edit_message_text(
                country_page_title('sc_', 0),
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
            context.user_data['type'] = 'student'
            return SELECT_COUNTRY
            
    elif query.data == 'info':
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data='back')]]
        query.edit_message_text(
            "ℹ️ BOT FEATURES:\n\n"
            "🧠 Smart Memory\n"
            "📋 Tap-to-Copy Names\n"
            "📸 Real Photos\n"
            "🔳 QR Codes\n"
            f"🌍 {COUNTRY_COUNT}+ Countries\n\n"
            "📱 @itsmeaab",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return MAIN_MENU
    elif query.data == 'back':
        return start(update, context)

def select_country(update: Update, context: CallbackContext):
    query = update.callback_query
    query.answer()
    uid = query.from_user.id
    
    if query.data.startswith('use_last_tc_') or query.data.startswith('use_last_sc_'):
        if query.data.startswith('use_last_tc_'):
            code = query.data.replace('use_last_tc_', '')
            doc_type = 'teacher'
        else:
            code = query.data.replace('use_last_sc_', '')
            doc_type = 'student'
        
        context.user_data['country'] = code
        context.user_data['doc_type'] = doc_type
        cfg = COUNTRIES[code]
        
        if doc_type == 'teacher':
            query.edit_message_text(
                f"✅ {cfg['flag']} `{cfg['name']}`\n\n"
                f"📝 Enter School Name:\n\n"
                f"/cancel to go back",
                parse_mode='Markdown'
            )
            return INPUT_SCHOOL
        else:
            colleges = load_colleges(code)
            if not colleges:
                keyboard = [[InlineKeyboardButton("🔙 Back", callback_data='back')]]
                query.edit_message_text(f"❌ No colleges for {cfg['name']}\n\n/start", reply_markup=InlineKeyboardMarkup(keyboard))
                return SELECT_COUNTRY
            context.user_data['colleges'] = colleges
            keyboard = [[InlineKeyboardButton(f"🏫 {c['name'][:50]}", callback_data=f'col_{i}')] for i, c in enumerate(colleges[:10])]
            if len(colleges) > 10:
                keyboard.append([InlineKeyboardButton("🔀 More", callback_data='more_col')])
            keyboard.append([InlineKeyboardButton("🔙 Back", callback_data='back')])
            query.edit_message_text(
                f"✅ {cfg['flag']} `{cfg['name']}`\n\n"
                f"🏫 Select College ({len(colleges)}):\n\n"
                f"📸 REAL PHOTOS\n🔳 QR CODES",
                reply_markup=InlineKeyboardMarkup(keyboard),
                parse_mode='Markdown'
            )
            return STUDENT_SELECT_COLLEGE
    
    if query.data == 'choose_new_teacher':
        keyboard = build_country_keyboard('tc_', 0)
        query.edit_message_text(
            country_page_title('tc_', 0),
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return SELECT_COUNTRY

    if query.data == 'choose_new_student':
        keyboard = build_country_keyboard('sc_', 0)
        query.edit_message_text(
            country_page_title('sc_', 0),
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return SELECT_COUNTRY

    if query.data.startswith('page_tc_') or query.data.startswith('page_sc_'):
        _, doc_prefix, page = query.data.split('_')
        page_num = int(page)
        doc_prefix = f"{doc_prefix}_"
        keyboard = build_country_keyboard(doc_prefix, page_num)
        query.edit_message_text(
            country_page_title(doc_prefix, page_num),
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return SELECT_COUNTRY
    if query.data in ['more_t', 'more_s']:
        doc_prefix = 'tc_' if query.data == 'more_t' else 'sc_'
        keyboard = build_country_keyboard(doc_prefix, 1)
        query.edit_message_text(
            country_page_title(doc_prefix, 1),
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return SELECT_COUNTRY
    elif query.data == 'back_countries':
        doc_prefix = 'tc_' if context.user_data.get('type') == 'teacher' else 'sc_'
        keyboard = build_country_keyboard(doc_prefix, 0)
        query.edit_message_text(
            country_page_title(doc_prefix, 0),
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return SELECT_COUNTRY
    elif query.data.startswith('tc_'):
        code = query.data.replace('tc_', '')
        context.user_data['country'] = code
        context.user_data['doc_type'] = 'teacher'
        cfg = COUNTRIES[code]
        query.edit_message_text(f"✅ {cfg['flag']} `{cfg['name']}`\n\n📝 Enter School Name:\n\n/cancel", parse_mode='Markdown')
        return INPUT_SCHOOL
    elif query.data.startswith('sc_'):
        code = query.data.replace('sc_', '')
        context.user_data['country'] = code
        context.user_data['doc_type'] = 'student'
        colleges = load_colleges(code)
        cfg = COUNTRIES[code]
        if not colleges:
            keyboard = [[InlineKeyboardButton("🔙 Back", callback_data='back')]]
            query.edit_message_text(f"❌ No colleges for {cfg['name']}\n\n/start", reply_markup=InlineKeyboardMarkup(keyboard))
            return SELECT_COUNTRY
        context.user_data['colleges'] = colleges
        keyboard = [[InlineKeyboardButton(f"🏫 {c['name'][:50]}", callback_data=f'col_{i}')] for i, c in enumerate(colleges[:10])]
        if len(colleges) > 10:
            keyboard.append([InlineKeyboardButton("🔀 More", callback_data='more_col')])
        keyboard.append([InlineKeyboardButton("🔙 Back", callback_data='back')])
        query.edit_message_text(f"✅ {cfg['flag']} {cfg['name']}\n\n🏫 Select College ({len(colleges)}):", reply_markup=InlineKeyboardMarkup(keyboard))
        return STUDENT_SELECT_COLLEGE

def input_school_name(update: Update, context: CallbackContext):
    school_name = update.message.text.strip()
    if len(school_name) < 3:
        update.message.reply_text("❌ Min 3 characters\n\n/cancel")
        return INPUT_SCHOOL
    context.user_data['school'] = school_name
    country_code = context.user_data['country']
    cfg = COUNTRIES[country_code]
    fake = Faker(cfg['locale'])
    auto_name = fake.name()
    auto_profession = generate_random_profession()
    context.user_data['teacher_data'] = {
        'name': auto_name,
        'id': generate_random_teacher_id(),
        'profession': auto_profession,
    }

    update.message.reply_text(
        f"✅ School: `{school_name}`\n"
        f"👤 `{auto_name}`\n"
        f"👔 {auto_profession}\n"
        f"🆔 `{context.user_data['teacher_data']['id']}`\n"
        f"🌍 {cfg['flag']} {cfg['name']}\n\n"
        f"📄 Auto-filled with professional faculty details (Faker) — no name input needed.\n"
        f"🖨️ Output: clear blue PDF letterheads with seals, signatures, and QR.\n\n"
        f"🔢 Quantity? (1-50)\n"
        f"📌 Tap a button or type a number\n\n"
        f"/cancel",
        parse_mode='Markdown',
        reply_markup=quantity_keyboard(),
    )
    return INPUT_QTY

def input_teacher_details(update: Update, context: CallbackContext):
    base = context.user_data.get('teacher_data', {})
    cfg = COUNTRIES[context.user_data['country']]
    fake = Faker(cfg['locale'])

    teacher_name = base.get('name') or fake.name()
    profession = base.get('profession') or generate_random_profession()
    teacher_id = base.get('id') or generate_random_teacher_id()
    start_date = base.get('start_date') or fake.date_between(start_date='-6y', end_date='-1y').strftime('%d %b %Y')
    academic_year = base.get('academic_year') or f"{datetime.now().year}-{datetime.now().year + 1}"
    employment_type = base.get('employment_type') or random.choice(['Full-Time Faculty', 'Part-Time Faculty', 'Adjunct', 'Permanent Staff'])
    subject = base.get('subject') or random.choice(['Mathematics', 'Science', 'English', 'Computer Science', 'History', 'Economics'])
    admin_name = base.get('admin_name') or fake.name()
    admin_title = base.get('admin_title') or random.choice(['Principal', 'Administrator', 'Registrar', 'Dean'])
    school_address = base.get('school_address') or f"{fake.city()}, {cfg['name']}"
    school_contact = base.get('school_contact') or fake.phone_number()
    school_email = base.get('school_email') or fake.company_email()
    school_website = base.get('school_website') or f"https://www.{fake.domain_name()}"
    context.user_data['teacher_data'] = {
        'name': teacher_name,
        'id': teacher_id,
        'profession': profession,
        'start_date': start_date,
        'academic_year': academic_year,
        'employment_type': employment_type,
        'subject': subject,
        'admin_name': admin_name,
        'admin_title': admin_title,
        'school_address': school_address,
        'school_contact': school_contact,
        'school_email': school_email,
        'school_website': school_website,
    }

    school_name = context.user_data['school']

    update.message.reply_text(
        f"✅ School: `{school_name}`\n"
        f"👤 `{teacher_name}`\n"
        f"👔 {profession}\n"
        f"🆔 `{teacher_id}`\n"
        f"🏫 Address: `{school_address}`\n"
        f"☎️ {school_contact} | ✉️ {school_email}\n"
        f"🌐 {school_website}\n"
        f"📅 Employed since {start_date} ({employment_type})\n"
        f"📚 Teaches {subject} | AY {academic_year}\n"
        f"🌍 {cfg['flag']} {cfg['name']}\n\n"
        f"📄 Auto-generated faculty identity (Faker) — keeping names professional without asking.\n"
        f"🖨️ Clear blue PDFs with seals, QR, school letterhead, admin signature line, and contact info.\n\n"
        f"🔢 Quantity? (1-50)\n"
        f"📌 Tap a button or type a number\n\n"
        f"/cancel",
        parse_mode='Markdown',
        reply_markup=quantity_keyboard(),
    )
    return INPUT_QTY

def select_student_college(update: Update, context: CallbackContext):
    query = update.callback_query
    query.answer()
    if query.data == 'more_col':
        colleges = context.user_data.get('colleges', [])
        keyboard = [[InlineKeyboardButton(f"🏫 {c['name'][:50]}", callback_data=f'col_{i}')] for i, c in enumerate(colleges[10:])]
        keyboard.append([InlineKeyboardButton("⬅️ Back", callback_data='back_col')])
        query.edit_message_text("🏫 More Colleges:", reply_markup=InlineKeyboardMarkup(keyboard))
        return STUDENT_SELECT_COLLEGE
    elif query.data == 'back_col':
        colleges = context.user_data.get('colleges', [])
        keyboard = [[InlineKeyboardButton(f"🏫 {c['name'][:50]}", callback_data=f'col_{i}')] for i, c in enumerate(colleges[:10])]
        if len(colleges) > 10:
            keyboard.append([InlineKeyboardButton("🔀 More", callback_data='more_col')])
        keyboard.append([InlineKeyboardButton("🔙 Back", callback_data='back')])
        query.edit_message_text(f"🏫 Select College ({len(colleges)}):", reply_markup=InlineKeyboardMarkup(keyboard))
        return STUDENT_SELECT_COLLEGE
    elif query.data.startswith('col_'):
        idx = int(query.data.replace('col_', ''))
        colleges = context.user_data.get('colleges', [])
        college = colleges[idx] if idx < len(colleges) else colleges[0]
        context.user_data['school'] = college['name']
        context.user_data['college_id'] = college['id']
        query.edit_message_text(
            f"✅ `{college['name']}`\n\n"
            f"🔢 Quantity? (1-50)\n"
            f"📌 Tap a button or type a number\n\n"
            f"📸 REAL PHOTOS\n"
            f"💡 Tap to copy\n"
            f"/cancel",
            parse_mode='Markdown',
            reply_markup=quantity_keyboard(),
        )
        return INPUT_QTY

def process_quantity(qty: int, update: Update, context: CallbackContext):
    if qty < 1 or qty > 50:
        update.effective_message.reply_text("❌ Enter 1-50")
        return INPUT_QTY

    uid = update.effective_user.id
    country_code = context.user_data['country']
    school_name = context.user_data['school']
    doc_type = context.user_data['doc_type']
    cfg = COUNTRIES[country_code]
    fake = Faker(cfg['locale'])
    message = update.effective_message

    # SAVE COUNTRY TO MEMORY
    save_last_country(uid, country_code, doc_type)

    progress_msg = message.reply_text(f"⏳ Generating {qty}...\n\n📸 Downloading photos...\n🔳 Creating QR codes...")

    if doc_type == 'teacher':
        base_teacher = context.user_data.get('teacher_data', {})
        used_teacher_names = set()
        used_teacher_ids = set()
        used_professions = set()
        for i in range(qty):
            try:
                teacher_data = base_teacher.copy()

                name = teacher_data.get('name') if qty == 1 else None
                tid = teacher_data.get('id') if qty == 1 else None
                name = name or fake.name()
                tid = tid or generate_random_teacher_id()
                profession = teacher_data.get('profession') or None
                start_date = teacher_data.get('start_date') or fake.date_between(start_date='-6y', end_date='-1y').strftime('%d %b %Y')
                academic_year = teacher_data.get('academic_year') or f"{datetime.now().year}-{datetime.now().year + 1}"
                employment_type = teacher_data.get('employment_type') or 'Full-Time Faculty'
                subject = teacher_data.get('subject') or 'Education'
                admin_name = teacher_data.get('admin_name') or fake.name()
                admin_title = teacher_data.get('admin_title') or 'Principal'
                school_address = teacher_data.get('school_address') or f"{fake.city()}, {cfg['name']}"
                school_contact = teacher_data.get('school_contact') or fake.phone_number()
                school_email = teacher_data.get('school_email') or fake.company_email()
                school_website = teacher_data.get('school_website') or f"https://www.{fake.domain_name()}"

                if not profession:
                    attempts = 0
                    while attempts < 20:
                        profession_candidate = generate_random_profession()
                        if qty == 1 or profession_candidate not in used_professions:
                            profession = profession_candidate
                            break
                        attempts += 1
                    profession = profession or generate_random_profession()

                if qty > 1:
                    attempts = 0
                    while name.lower() in used_teacher_names:
                        if attempts > 12:
                            name = f"{fake.first_name()} {fake.last_name()} {random.choice(['Jr.', 'Sr.', 'II', 'III'])}"
                            break
                        name = fake.name()
                        attempts += 1

                    attempts = 0
                    while tid in used_teacher_ids:
                        if attempts > 12:
                            tid = f"{tid}-{random.randint(100, 999)}"
                            break
                        tid = generate_random_teacher_id()
                        attempts += 1

                used_teacher_names.add(name.lower())
                used_teacher_ids.add(tid)
                used_professions.add(profession)

                issue_date = datetime.now() - timedelta(days=random.randint(1, 90))

                id_img = gen_teacher_id_auto(
                    school_name,
                    name,
                    tid,
                    profession,
                    school_address,
                    school_contact,
                    school_email,
                    admin_name,
                    admin_title,
                    start_date,
                    subject,
                    employment_type,
                    academic_year,
                    school_website,
                    country_code,
                    issue_date,
                )
                buf_id = BytesIO()
                id_img.convert("RGB").save(buf_id, format='PDF')
                buf_id.seek(0)
                buf_id.name = f"{tid}_ID.pdf"

                # TAP-TO-COPY CAPTION
                cap_id = (
                    f"✅ TEACHER ID #{i+1}/{qty}\n\n"
                    f"👤 `{name}` ({profession})\n"
                    f"🆔 `{tid}` | AY {academic_year}\n"
                    f"🏫 `{school_name}`\n"
                    f"📍 {school_address}\n"
                    f"☎️ {school_contact} | ✉️ {school_email}\n"
                    f"🌐 {school_website}\n"
                    f"📚 {subject} • Since {start_date} ({employment_type})\n"
                    f"👤 Admin: {admin_name} ({admin_title})\n"
                    f"🌍 {cfg['flag']} {cfg['name']}\n\n"
                    f"💡 Tap to copy\n"
                    f"📅 {now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                    f"🗂️ Blue letterhead PDF with seal, QR, admin signature, and contact info"
                )
                message.reply_document(document=buf_id, caption=cap_id, parse_mode='Markdown')
                buf_id.close()

                sal_img = gen_salary_receipt_auto(
                    school_name,
                    name,
                    tid,
                    profession,
                    school_address,
                    school_contact,
                    school_email,
                    admin_name,
                    admin_title,
                    start_date,
                    subject,
                    employment_type,
                    academic_year,
                    school_website,
                    country_code,
                    issue_date,
                )
                buf_sal = BytesIO()
                sal_img.convert("RGB").save(buf_sal, format='PDF')
                buf_sal.seek(0)
                buf_sal.name = f"{tid}_SALARY.pdf"

                cap_sal = (
                    f"💵 SALARY RECEIPT #{i+1}/{qty}\n\n"
                    f"👤 `{name}` ({profession})\n"
                    f"🆔 `{tid}` | Since {start_date}\n"
                    f"🏫 `{school_name}`\n"
                    f"📍 {school_address}\n"
                    f"☎️ {school_contact} | ✉️ {school_email}\n"
                    f"🌐 {school_website}\n"
                    f"📚 {subject} • {employment_type} • AY {academic_year}\n"
                    f"👤 Admin: {admin_name} ({admin_title})\n"
                    f"🌍 {cfg['flag']} {cfg['name']}\n"
                    f"📅 {now().strftime('%Y-%m-%d')} (current)\n"
                    f"🗂️ Clear blue payroll PDF with letterhead, seal, admin signature"
                )
                message.reply_document(document=buf_sal, caption=cap_sal, parse_mode='Markdown')
                buf_sal.close()

                if (i + 1) % 5 == 0:
                    try:
                        progress_msg.edit_text(f"⏳ {i+1}/{qty} generated\n📸 Photos ready\n🔳 QR codes embedded")
                    except:
                        pass
                if i < qty - 1:
                    time.sleep(0.3)
            except Exception as e:
                logger.error(f"Error {i+1}: {e}")
    else:
        colleges = context.user_data.get('colleges', [])
        for i in range(qty):
            try:
                college = random.choice(colleges)
                student_name = fake.name()
                student_id = generate_random_student_id()
                program = generate_random_program()

                id_img = gen_student_id_auto(college['name'], student_name, student_id, program, country_code)
                buf_id = BytesIO()
                id_img.save(buf_id, format='PNG')
                buf_id.seek(0)
                buf_id.name = f"{student_id}_ID.png"

                # TAP-TO-COPY CAPTION
                cap_id = (
                    f"✅ STUDENT ID #{i+1}/{qty}\n\n"
                    f"👤 `{student_name}`\n"
                    f"🏫 `{college['name']}`\n"
                    f"🆔 `{student_id}`\n"
                    f"📚 {program}\n"
                    f"🌍 {cfg['flag']} {cfg['name']}\n\n"
                    f"📸 Real Photo: ✅\n"
                    f"🔳 QR Code: ✅\n"
                    f"💡 Tap to copy\n\n"
                    f"📅 {now().strftime('%Y-%m-%d %H:%M:%S')}"
                )
                message.reply_photo(photo=buf_id, caption=cap_id, parse_mode='Markdown')
                buf_id.close()

                if (i + 1) % 5 == 0:
                    try:
                        progress_msg.edit_text(f"⏳ {i+1}/{qty} generated\n📸 Photos downloaded\n🔳 QR codes embedded")
                    except:
                        pass
                if i < qty - 1:
                    time.sleep(0.3)
            except Exception as e:
                logger.error(f"Error {i+1}: {e}")

    try:
        progress_msg.delete()
    except:
        pass

    if doc_type == 'teacher':
        message.reply_text(
            f"✅ DONE!\n\n"
            f"📄 {qty} docs generated\n"
            f"🌍 {cfg['flag']} {cfg['name']}\n"
            f"📸 Real Photos: ✅\n"
            f"🔳 QR Codes: ✅\n"
            f"🗂️ Exported as clear PDF files with letterhead, seal, admin signature, and contact details\n"
            f"🧠 Country Saved!\n\n"
            f"📋 Each PDF now shows: full name, role, school name, school address, contact info, current employment confirmation, admin name + signature line, issue date, and teacher ID.\n"
            f"🔵 Bonus details included: employment start date, subjects taught, school website, academic year, and employment type.\n\n"
            f"👍 For Canva approval, prefer REAL school documents (ID card, employment/offer letter, contract, staff badge, portal screenshot, accreditation/certificate, or admin letter). Pay stubs only if sensitive info is hidden.\n\n"
            f"/start"
        )
    else:
        message.reply_text(
            f"✅ DONE!\n\n"
            f"📄 {qty} docs generated\n"
            f"🌍 {cfg['flag']} {cfg['name']}\n"
            f"📸 Real Photos: ✅\n"
            f"🔳 QR Codes: ✅\n"
            f"🧠 Country Saved!\n\n"
            f"/start"
        )
    return ConversationHandler.END


def input_quantity(update: Update, context: CallbackContext):
    try:
        qty = int(update.message.text.strip())
        return process_quantity(qty, update, context)
    except ValueError:
        update.message.reply_text("❌ Numbers only (1-50)\n\n/cancel")
        return INPUT_QTY


def handle_quantity_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    query.answer()
    if query.data == 'qty_custom':
        query.message.reply_text("✏️ Send a custom number between 1 and 50\n\n/cancel")
        return INPUT_QTY
    if query.data.startswith('qty_'):
        try:
            qty = int(query.data.replace('qty_', ''))
            return process_quantity(qty, update, context)
        except ValueError:
            query.message.reply_text("❌ Invalid quantity\n\n/cancel")
            return INPUT_QTY
    return INPUT_QTY

def cancel(update: Update, context: CallbackContext):
    update.message.reply_text("❌ Cancelled\n\n/start")
    return ConversationHandler.END

def error_handler(update: Update, context: CallbackContext):
    logger.warning(f'Update {update} caused error {context.error}')

def doc_airwallex_otp_command(update: Update, context: CallbackContext):
    uid = update.effective_user.id
    if not is_authorized(uid):
        update.message.reply_text("❌ ACCESS DENIED\n\nContact: @itsmeaab")
        return

    return airwallex_otp_command(update, context)


def register_doc_handlers(updater: Updater):
    dp = updater.dispatcher

    conv = ConversationHandler(
        entry_points=[CommandHandler('start', start), CommandHandler('teacher', teacher_command)],
        states={
            MAIN_MENU: [CallbackQueryHandler(main_menu)],
            SELECT_DOC: [CallbackQueryHandler(main_menu)],
            SELECT_COUNTRY: [CallbackQueryHandler(select_country)],
            INPUT_SCHOOL: [MessageHandler(Filters.text & ~Filters.command, input_school_name), CommandHandler('cancel', cancel)],
            INPUT_TEACHER_DETAILS: [MessageHandler(Filters.text & ~Filters.command, input_teacher_details), CommandHandler('cancel', cancel)],
            STUDENT_SELECT_COLLEGE: [CallbackQueryHandler(select_student_college)],
            INPUT_QTY: [
                CallbackQueryHandler(handle_quantity_callback),
                MessageHandler(Filters.text & ~Filters.command, input_quantity),
                CommandHandler('cancel', cancel)
            ],
            ADD_USER_INPUT: [
                CallbackQueryHandler(main_menu),
                MessageHandler(Filters.text & ~Filters.command, add_user_inline_input),
                CommandHandler('cancel', cancel)
            ],
        },
        fallbacks=[CommandHandler('cancel', cancel), CommandHandler('start', start)],
        per_message=False,
        allow_reentry=True,
    )

    dp.add_handler(conv)
    dp.add_handler(CommandHandler('adduser', add_user_command))
    dp.add_handler(CommandHandler('addsuper', add_super_admin_command))
    dp.add_handler(CommandHandler('countries', list_countries_command))
    dp.add_handler(CommandHandler('otp', doc_airwallex_otp_command))
    dp.add_error_handler(error_handler)


def register_airwallex_handlers(updater: Updater):
    dp = updater.dispatcher

    dp.add_handler(CommandHandler('start', lambda update, context: update.message.reply_text("Send /otp to get the latest Airwallex code.")))
    dp.add_handler(CommandHandler('otp', airwallex_otp_command))
    dp.add_error_handler(error_handler)


def start_doc_bot(token: str):
    updater = Updater(token, use_context=True)
    register_doc_handlers(updater)

    updater.start_polling()
    return updater


def start_airwallex_bot(token: str):
    updater = Updater(token, use_context=True)
    register_airwallex_handlers(updater)

    updater.start_polling()
    return updater


def main():
    tokens = []
    if DOC_BOT_TOKEN:
        tokens.append(("Docs bot", DOC_BOT_TOKEN, start_doc_bot))
    if AIRWALLEX_BOT_TOKEN:
        tokens.append(("Airwallex bot", AIRWALLEX_BOT_TOKEN, start_airwallex_bot))

    if not tokens:
        logger.error("No bot tokens configured. Exiting.")
        return

    logger.info("="*80)
    logger.info("🚀 BOT STARTING - WITH MEMORY & TAP-TO-COPY")
    logger.info(f"📅 2025-10-22 08:43:57 UTC")
    logger.info(f"👤 User: Adeebaabkhan")
    logger.info("🧠 SMART MEMORY: Remembers last country")
    logger.info("📋 TAP-TO-COPY: All names copyable")
    logger.info("📸 REAL PHOTOS: thispersondoesnotexist.com")
    logger.info("🔳 QR CODES: Professional")
    logger.info(f"🌍 {COUNTRY_COUNT} COUNTRIES")
    logger.info("="*80)

    updaters = []
    for label, token, starter in tokens:
        updater = starter(token)
        logger.info(f"✅ {label} started! 🤖 @{updater.bot.get_me().username}")
        updaters.append(updater)

    if updaters:
        updaters[0].idle()

if __name__ == '__main__':
    main()
