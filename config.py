import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXTENSION_PATH = os.path.join(BASE_DIR, "Jego")
USER_DATA_DIR = os.path.join(BASE_DIR, "chrome_temp_data")
CLASH_CONFIG_PATH = os.path.join(BASE_DIR, "config.yml")
SINGBOX_CONFIG_PATH = os.path.join(BASE_DIR, "sing-box.json")
REGISTER_URL = "chrome-extension://hibgikgmeipfjgfogkhhkalefggcghin/options.html#/signup"
POPUP_URL = "chrome-extension://hibgikgmeipfjgfogkhhkalefggcghin/popup.html"
