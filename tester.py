import os
import yaml
import time
import requests
import urllib3
import config

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_proxies(test_url="https://icanhazip.com"):
    """
    测试现有 Clash 配置中的节点。
    返回 True 表示至少有一个节点可用，返回 False 表示全部失效或无配置。
    """
    print(f"\n🔍 开始连通性测试，目标: {test_url}")
    
    if not os.path.exists(config.CLASH_CONFIG_PATH):
        print("❌ 找不到配置文件，无法测试。")
        return False

    with open(config.CLASH_CONFIG_PATH, 'r', encoding='utf-8') as f:
        try:
            clash_dict = yaml.safe_load(f) or {}
        except Exception as e:
            print(f"❌ 读取配置失败: {e}")
            return False

    proxies_list = clash_dict.get('proxies', [])
    auto_nodes = [p for p in proxies_list if str(p.get('name', '')).startswith('自动节点')]

    if not auto_nodes:
        print("❌ 没有找到自动节点。")
        return False

    print(f"🎯 找到 {len(auto_nodes)} 个节点，开始测试...")

    alive_count = 0
    for node in auto_nodes:
        name = node.get('name')
        server = node.get('server')
        port = node.get('port')
        
        proxy_url = f"https://{server}:{port}"
        proxies_config = {
            "http": proxy_url,
            "https": proxy_url
        }

        print(f"🔄 测试 [{name}] ... ", end="", flush=True)
        try:
            res = requests.get(test_url, proxies=proxies_config, timeout=5, verify=False)
            if res.status_code == 200:
                print(f"✅ 成功! (IP: {res.text.strip()})")
                alive_count += 1
            else:
                print(f"⚠️ 状态码异常: {res.status_code}")
        except Exception as e:
            print(f"❌ 失败")
            
    if alive_count > 0:
        print(f"✅ 测试完成，共有 {alive_count}/{len(auto_nodes)} 个节点可用。")
        return True
    else:
        print("❌ 测试完成，所有节点均已失效。")
        return False
