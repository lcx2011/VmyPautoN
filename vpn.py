import datetime
import os
import re
import time
import yaml
from playwright.sync_api import sync_playwright
import json
# ==================== 🛠️ 路径配置 ====================
EXTENSION_PATH = os.path.abspath(r"C:\Users\work\Desktop\vpn\Jego")
USER_DATA_DIR = os.path.abspath("./chrome_temp_data")
CLASH_CONFIG_PATH = os.path.abspath(r"./config.yml")
REGISTER_URL = "chrome-extension://hibgikgmeipfjgfogkhhkalefggcghin/options.html#/signup" 

# 检查插件是否存在
if not os.path.exists(os.path.join(EXTENSION_PATH, "manifest.json")):
    print(f"❌ 警告: 在 {EXTENSION_PATH} 没找到 manifest.json，请确认路径没有套娃文件夹！")

def run_smart_automation():
    print("🚀 启动带自动嗅探功能的浏览器...")
    with sync_playwright() as p:
        browser_context = p.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=False, # 调试期间必须保持 False，方便看网页动作
            args=[
                f"--disable-extensions-except={EXTENSION_PATH}",
                f"--load-extension={EXTENSION_PATH}"
            ]
        )
        
        # =========================================================
        # 1. 打开临时邮箱网页，动态嗅探邮箱地址
        # =========================================================
        print("📧 正在打开临时邮箱...")
        mail_page = browser_context.new_page()
        mail_page.route("**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2}", lambda route: route.abort())
        try:
            print("⏳ 正在请求页面（已忽略图片加载）...")
            mail_page.goto("https://tempmail.ing/zh-CN/", timeout=12000, wait_until="domcontentloaded")
        except Exception as e:
            # 即便超时了也不崩溃，捕获异常后强行让代码继续往下走，尝试去盲抓邮箱
            print(f"⚠️ 页面在 12 秒内未完全加载完毕，但我们将强行继续尝试提取数据... (原因: {e})")
        
        email_address = None
        print("🔍 正在页面中搜索邮箱地址...")
        for i in range(15): # 尝试 15 次，每次间隔 1 秒
            email_address = mail_page.evaluate("""() => {
                // 策略1: 找输入框里包含 @ 的值
                let inputs = Array.from(document.querySelectorAll('input'));
                let emailInput = inputs.find(i => i.value && i.value.includes('@'));
                if (emailInput) return emailInput.value;
                
                // 策略2: 直接在整个网页文本里用正则匹配邮箱格式
                let match = document.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
                return match ? match[0] : null;
            }""")
            if email_address and "@" in email_address:
                break
            time.sleep(1)
            
        if not email_address:
            raise Exception("❌ 无法在页面上自动抓取到邮箱，可能网页还没加载完或者结构太奇葩。")
        print(f"✅ 成功抓取到临时邮箱: {email_address}")

       # =========================================================
        # 2. 打开插件注册页，自动填表 (修复版)
        # =========================================================
        print("📝 开始智能填充注册表单...")
        reg_page = browser_context.new_page()
        # 注意：插件页面需要时间初始化，先等个 2 秒
        time.sleep(2) 
        reg_page.goto(REGISTER_URL)
        
        # 填邮箱
        email_input = reg_page.locator("input[type='email'], input[name*='mail' i]").first
        email_input.wait_for(state="visible", timeout=10000)
        email_input.fill(email_address)
        
        # 🔥 修改点1：通杀所有密码框 (密码 + 确认密码)
        pwd_inputs = reg_page.locator("input[type='password']")
        pwd_inputs.first.wait_for(state="visible") # 等待密码框加载
        pwd_count = pwd_inputs.count()
        print(f"🔑 自动检测到 {pwd_count} 个密码输入框，正在填充...")
        
        for i in range(pwd_count):
            pwd_inputs.nth(i).fill("123456")
            time.sleep(0.2) # 微微停顿，让网页 JS 有时间触发“密码一致”的校验
        
        # 🔥 修改点2：使用“回车大法” + 扩大按钮搜索范围的双保险
        print("🖱️ 正在尝试提交表单...")
        try:
            # 绝招 1：直接在最后一个密码框按下回车键，绝大多数表单吃这一套
            pwd_inputs.nth(pwd_count - 1).press("Enter")
            time.sleep(1)
        except Exception:
            pass
            
        try:
            # 绝招 2：如果回车没用，尝试寻找按钮，扩大了匹配词库
            submit_btn = reg_page.locator("button, input[type='button'], input[type='submit']").filter(
                has_text=re.compile(r"Sign|Register|注册|提交|Create|Next|Continue|下一步|确定|确认|Join", re.IGNORECASE)
            ).first
            
            # 增加兜底：如果上面的字眼都匹配不到，盲猜 class 里带有 submit、primary 或 btn 且类型不是 input 的元素
            if submit_btn.count() == 0:
                 submit_btn = reg_page.locator("button[class*='submit' i], button[class*='primary' i], button[type='submit']").first
                 
            # 尝试点击，如果 3 秒点不到就忽略，因为可能刚才的“回车大法”已经成功了
            submit_btn.click(timeout=3000)
        except Exception:
            print("⚠️ 未能通过代码点击按钮（可能是回车已经生效，或者按钮太特殊）。")
            
        print("✅ 注册表单提交指令已执行！")

        # =========================================================
        # 3. 切回邮箱，查收邮件并获取激活链接 (穿透 iframe 终极版)
        # =========================================================
        print("⏳ 等待 15 秒让邮件飞一会...")
        time.sleep(15)
        mail_page.bring_to_front()
        
        print("📥 正在监控收件箱...")
        email_locator = mail_page.locator(".email-item").first
        
        try:
            email_locator.wait_for(state="visible", timeout=30000)
            print("✉️ 发现新邮件！正在点击以展开正文...")
            email_locator.click()
            time.sleep(3) # 多等一会，确保 iframe 和正文完全加载
        except Exception:
            print("⚠️ 未能在外层列表点到邮件，可能网站自动展开了，继续尝试提取...")

        # 开始暴力提取激活链接
        activation_url = None
        print("🔗 正在穿透所有 iframe 提取激活链接...")
        for i in range(10): # 循环 10 次，等待异步加载
            # 遍历当前页面内的所有 frame（主页面 + 所有的 iframe 画中画）
            for frame in mail_page.frames:
                try:
                    # 直接获取该 frame 的完整 HTML 源码
                    html_content = frame.content()
                    
                    # 用正则表达式直接在源码里扫：寻找以 http 开头，包含 illustr.ai 的链接
                    # [^\s\"'>]+ 意思是匹配直到遇到空格或引号为止的所有字符
                    match = re.search(r"https?://[a-zA-Z0-9.-]*illustr\.ai/user/active/[a-zA-Z0-9]+", html_content)                    
                    if match:
                        activation_url = match.group(0)
                        break # 找到了就跳出 frame 循环
                except Exception:
                    continue # 如果某个 frame 跨域读取失败，忽略并继续下一个
            
            if activation_url:
                break # 找到了就跳出重试循环
            
            time.sleep(1) # 没找到就等 1 秒再试

        if not activation_url:
            print("⚠️ 依然没找到激活链接。你可以手动复制控制台的这个 URL 去激活！")
            input("等待你手动处理... 完成后按 Enter 键继续...")
        else:
            print(f"✅ 成功穿透提取到激活链接: {activation_url}")
            print("🔓 正在后台访问激活链接...")
            act_page = browser_context.new_page()
            act_page.goto(activation_url)
            time.sleep(5)
            print("✅ 账号激活疑似完成！")
        # =========================================================
        # 🌟 新增步骤：模拟点击插件图标，触发节点下发
        # =========================================================
        print("🖱️ 正在模拟点击插件图标以触发网络配置下发...")
        # 绝大多数插件的点击面板是 popup.html，部分使用 index.html，可根据实际情况替换
        POPUP_URL = "chrome-extension://hibgikgmeipfjgfogkhhkalefggcghin/popup.html" 
        
        popup_page = browser_context.new_page()
        try:
            popup_page.goto(POPUP_URL)
            # 等待网络请求闲置，确保它有时间向服务器请求节点数据
            popup_page.wait_for_load_state("networkidle", timeout=10000)
            print("⏳ 插件面板已打开，等待 8 秒让其完成握手并将节点写入本地数据库...")
            time.sleep(8) 
        except Exception as e:
            print(f"⚠️ 打开插件面板时出现小插曲，可能页面名称不是 popup.html: {e}")
        finally:
            popup_page.close()
        # =========================================================
        # 4. 提取底层数据库信息
        # =========================================================
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

def update_clash_yaml(storage_data):
    """全新解析逻辑：穿透 PAC 脚本，暴力提取节点和端口"""
    if not storage_data:
        print("❌ 读取到的数据为空，提取失败。")
        return

    # 无论 JSON 嵌套多深，直接拍扁成字符串进行正则通杀
    raw_string = json.dumps(storage_data)

    # 正则匹配形如 "HTTPS xxx.ukuaishou.com:58091" 的数据
    # 分组提取出 域名 (Group 1) 和 端口 (Group 2)
    matches = re.findall(r"HTTPS\s+([a-zA-Z0-9.-]+):(\d+)", raw_string)

    if not matches:
        print("❌ 未在底层数据中匹配到 HTTPS 节点。可能是账号没激活成功，或者还没下发配置。")
        return

    # 暴力去重：因为 PAC 脚本里几百个网站可能共用 2-3 个节点
    unique_servers = list(set(matches))
    print(f"✅ 成功从 PAC 脚本中提取并去重得到 {len(unique_servers)} 个独享节点！")

    if not os.path.exists(CLASH_CONFIG_PATH):
        print("⚠️ 找不到已有的 Clash 文件，将创建一个新文件。")
        clash_dict = {'proxies': []}
    else:
        with open(CLASH_CONFIG_PATH, 'r', encoding='utf-8') as f:
            try:
                clash_dict = yaml.safe_load(f) or {'proxies': []}
            except Exception as e:
                print(f"❌ 读取已有 Clash YAML 失败，将新建: {e}")
                clash_dict = {'proxies': []}

    # 确保 proxies 是个列表
    if 'proxies' not in clash_dict or not isinstance(clash_dict['proxies'], list):
        clash_dict['proxies'] = []

    # 清理上次生成的旧节点
    clash_dict['proxies'] = [p for p in clash_dict['proxies'] if not str(p.get('name', '')).startswith('自动节点')]

    # 组装提取到的真实节点
    for idx, (server, port) in enumerate(unique_servers):
        new_proxy = {
            'name': f'自动节点-{idx + 1}',
            'type': 'http',
            'server': server,
            'port': int(port),  # 自动填入提取到的 58091 等端口
            'tls': True,
            'sni': server,
            'skip-cert-verify': False
        }
        clash_dict['proxies'].append(new_proxy)

    with open(CLASH_CONFIG_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(clash_dict, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
    
    print(f"🎉 节点已成功写入: {CLASH_CONFIG_PATH}")
import sys
import requests
import urllib3

# 禁用 requests 的安全警告（因为很多代理节点的 HTTPS 证书是自签名的）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_proxies(test_url="https://icanhazip.com"):
    """直接读取 YAML 文件中的节点，并测试连通性"""
    print(f"\n🔍 开始连通性测试，目标网站: {test_url}")
    
    if not os.path.exists(CLASH_CONFIG_PATH):
        print("❌ 找不到 Clash 配置文件，请先跑一遍提取流程！")
        return

    with open(CLASH_CONFIG_PATH, 'r', encoding='utf-8') as f:
        try:
            clash_dict = yaml.safe_load(f) or {}
        except Exception as e:
            print(f"❌ 读取 Clash YAML 失败: {e}")
            return

    # 过滤出我们刚才提取的自动节点
    proxies_list = clash_dict.get('proxies', [])
    auto_nodes = [p for p in proxies_list if str(p.get('name', '')).startswith('自动节点')]

    if not auto_nodes:
        print("❌ 没有在配置文件中找到 [自动节点]，请确认是否成功提取。")
        return

    print(f"🎯 找到 {len(auto_nodes)} 个节点，准备进行逐个测试...\n")

    for node in auto_nodes:
        name = node.get('name')
        server = node.get('server')
        port = node.get('port')
        
        # 因为我们抓到底层是 HTTPS 代理，所以在请求时要指定 https://
        proxy_url = f"https://{server}:{port}"
        proxies_config = {
            "http": proxy_url,
            "https": proxy_url
        }

        print(f"🔄 正在测试 [{name}] ... ", end="", flush=True)
        try:
            # 发起请求，设置 5 秒超时，并且跳过证书校验 (verify=False)
            start_time = time.time()
            res = requests.get(test_url, proxies=proxies_config, timeout=5, verify=False)
            
            if res.status_code == 200:
                elapsed = time.time() - start_time
                # 打印出请求到的真实 IP 和延迟
                print(f"✅ 成功! 代理出口IP: {res.text.strip()} (延迟: {elapsed:.2f}s)")
            else:
                print(f"⚠️ 状态码异常: {res.status_code}")
        except requests.exceptions.Timeout:
            print("❌ 失败: 连接超时 (节点可能已失效或被墙)")
        except Exception as e:
            print(f"❌ 失败: 拒绝连接 ({type(e).__name__})")
if __name__ == "__main__":
    # 如果命令行带了 --test 参数，就只运行测试模块
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("🧪 进入仅测试模式 (跳过爬取流程)...")
        test_proxies("https://icanhazip.com")
        sys.exit(0)

    # 否则，运行完整的流程：抓取 -> 写配置 -> 测连通性
    try:
        print("▶️ 开始执行完整爬取流程...")
        raw_data = run_smart_automation()
        update_clash_yaml(raw_data)
        
        # 写完配置后，顺便测一下
        test_proxies("https://icanhazip.com")
    except Exception as e:
        print(f"❌ 运行出错: {e}")