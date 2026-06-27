import os
import re
import time
from playwright.sync_api import sync_playwright
import config

def run_smart_automation(headless=True):
    print(f"🚀 启动带自动嗅探功能的浏览器 (headless={headless})...")
    
    if not os.path.exists(os.path.join(config.EXTENSION_PATH, "manifest.json")):
        raise FileNotFoundError(f"❌ 警告: 在 {config.EXTENSION_PATH} 没找到 manifest.json，请确认路径没有套娃文件夹！")

    with sync_playwright() as p:
        args = [
            f"--disable-extensions-except={config.EXTENSION_PATH}",
            f"--load-extension={config.EXTENSION_PATH}"
        ]
        
        # 新版 chromium headless 支持插件
        if headless:
            args.append("--headless=new")

        browser_context = p.chromium.launch_persistent_context(
            user_data_dir=config.USER_DATA_DIR,
            headless=False, # Playwright 默认的 headless 不支持插件，通过 args 传递 --headless=new 解决
            args=args
        )
        
        print("🔍 正在获取动态生成的插件 ID...")
        # 等待 service worker 加载
        background_worker = None
        for _ in range(50):
            if browser_context.service_workers:
                background_worker = browser_context.service_workers[0]
                break
            time.sleep(0.1)
            
        if not background_worker:
            raise Exception("❌ 无法获取插件的 background worker，请检查插件是否正常加载。")
            
        extension_id = background_worker.url.split("/")[2]
        print(f"✅ 成功获取插件 ID: {extension_id}")
        
        dynamic_register_url = f"chrome-extension://{extension_id}/options.html#/signup"
        dynamic_popup_url = f"chrome-extension://{extension_id}/popup.html"
        
        # 1. 临时邮箱
        print("📧 正在打开临时邮箱...")
        mail_page = browser_context.new_page()
        mail_page.route("**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2}", lambda route: route.abort())
        try:
            print("⏳ 正在请求页面（已忽略图片加载）...")
            mail_page.goto("https://tempmail.ing/zh-CN/", timeout=12000, wait_until="domcontentloaded")
        except Exception as e:
            print(f"⚠️ 页面未完全加载，强行继续... ({e})")
        
        email_address = None
        print("🔍 正在页面中搜索邮箱地址...")
        for i in range(15):
            email_address = mail_page.evaluate("""() => {
                let inputs = Array.from(document.querySelectorAll('input'));
                let emailInput = inputs.find(i => i.value && i.value.includes('@'));
                if (emailInput) return emailInput.value;
                let match = document.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
                return match ? match[0] : null;
            }""")
            if email_address and "@" in email_address:
                break
            time.sleep(1)
            
        if not email_address:
            raise Exception("❌ 无法在页面上自动抓取到邮箱。")
        print(f"✅ 成功抓取到临时邮箱: {email_address}")

        # 2. 注册表单
        print("📝 开始智能填充注册表单...")
        reg_page = browser_context.new_page()
        time.sleep(2) 
        reg_page.goto(dynamic_register_url)
        
        email_input = reg_page.locator("input[type='email'], input[name*='mail' i]").first
        email_input.wait_for(state="visible", timeout=10000)
        email_input.fill(email_address)
        
        pwd_inputs = reg_page.locator("input[type='password']")
        pwd_inputs.first.wait_for(state="visible")
        pwd_count = pwd_inputs.count()
        print(f"🔑 自动检测到 {pwd_count} 个密码输入框，正在填充...")
        
        for i in range(pwd_count):
            pwd_inputs.nth(i).fill("123456")
            time.sleep(0.2)
        
        print("🖱️ 正在尝试提交表单...")
        try:
            pwd_inputs.nth(pwd_count - 1).press("Enter")
            time.sleep(1)
        except Exception:
            pass
            
        try:
            submit_btn = reg_page.locator("button, input[type='button'], input[type='submit']").filter(
                has_text=re.compile(r"Sign|Register|注册|提交|Create|Next|Continue|下一步|确定|确认|Join", re.IGNORECASE)
            ).first
            if submit_btn.count() == 0:
                 submit_btn = reg_page.locator("button[class*='submit' i], button[class*='primary' i], button[type='submit']").first
            submit_btn.click(timeout=3000)
        except Exception:
            print("⚠️ 未能通过代码点击按钮（可能回车已生效）。")
            
        print("✅ 注册表单提交指令已执行！")

        # 3. 查收邮件
        print("⏳ 等待 15 秒让邮件飞一会...")
        time.sleep(15)
        mail_page.bring_to_front()
        
        print("📥 正在监控收件箱...")
        email_locator = mail_page.locator(".email-item").first
        
        try:
            email_locator.wait_for(state="visible", timeout=30000)
            email_locator.click()
            time.sleep(3)
        except Exception:
            print("⚠️ 未能在外层列表点到邮件，尝试继续提取...")

        activation_url = None
        print("🔗 正在穿透所有 iframe 提取激活链接...")
        for i in range(10):
            for frame in mail_page.frames:
                try:
                    html_content = frame.content()
                    match = re.search(r"https?://[a-zA-Z0-9.-]*illustr\.ai/user/active/[a-zA-Z0-9]+", html_content)                    
                    if match:
                        activation_url = match.group(0)
                        break
                except Exception:
                    continue
            if activation_url:
                break
            time.sleep(1)

        if not activation_url:
            raise Exception("❌ 没找到激活链接。在无头模式下无法手动干预，流程失败！")
            
        print(f"✅ 成功穿透提取到激活链接: {activation_url}")
        print("🔓 正在后台访问激活链接...")
        act_page = browser_context.new_page()
        act_page.goto(activation_url)
        time.sleep(5)
        print("✅ 账号激活疑似完成！")

        # 4. 触发下发
        print("🖱️ 正在模拟点击插件图标以触发网络配置下发...")
        popup_page = browser_context.new_page()
        try:
            popup_page.goto(dynamic_popup_url)
            popup_page.wait_for_load_state("networkidle", timeout=10000)
            print("⏳ 等待 8 秒让其完成握手...")
            time.sleep(8) 
        except Exception as e:
            print(f"⚠️ 打开插件面板异常: {e}")
        finally:
            popup_page.close()

        # 5. 提取数据
        print("⚙️ 正在提取插件底层数据库配置...")
        background_worker = None
        if browser_context.service_workers:
            background_worker = browser_context.service_workers[0]

        if not background_worker:
            browser_context.close()
            raise Exception("无法连接到插件后台，请确认插件已经加载。")

        js_code = """
        async () => {
            return new Promise((resolve) => {
                if (chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get(null, (result) => resolve(result));
                } else {
                    resolve(null);
                }
            });
        }
        """
        storage_data = background_worker.evaluate(js_code)
        browser_context.close()
        return storage_data
