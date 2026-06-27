import os
import re
import json
import yaml
import config

def extract_nodes(storage_data):
    if not storage_data:
        print("❌ 读取到的数据为空，提取失败。")
        return []

    raw_string = json.dumps(storage_data)
    matches = re.findall(r"HTTPS\s+([a-zA-Z0-9.-]+):(\d+)", raw_string)

    if not matches:
        print("❌ 未在底层数据中匹配到 HTTPS 节点。")
        return []

    unique_servers = list(set(matches))
    print(f"✅ 成功从底层提取得到 {len(unique_servers)} 个独享节点！")
    return unique_servers

def update_clash_yaml(nodes):
    if not nodes:
        return
        
    if not os.path.exists(config.CLASH_CONFIG_PATH):
        clash_dict = {'proxies': []}
    else:
        with open(config.CLASH_CONFIG_PATH, 'r', encoding='utf-8') as f:
            try:
                clash_dict = yaml.safe_load(f) or {'proxies': []}
            except Exception as e:
                clash_dict = {'proxies': []}

    if 'proxies' not in clash_dict or not isinstance(clash_dict['proxies'], list):
        clash_dict['proxies'] = []

    # 清理旧节点
    clash_dict['proxies'] = [p for p in clash_dict['proxies'] if not str(p.get('name', '')).startswith('自动节点')]

    for idx, (server, port) in enumerate(nodes):
        new_proxy = {
            'name': f'自动节点-{idx + 1}',
            'type': 'http',
            'server': server,
            'port': int(port),
            'tls': True,
            'sni': server,
            'skip-cert-verify': False
        }
        clash_dict['proxies'].append(new_proxy)

    with open(config.CLASH_CONFIG_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(clash_dict, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
    
    print(f"🎉 Clash 节点已写入: {config.CLASH_CONFIG_PATH}")

def update_singbox_json(nodes):
    if not nodes:
        return
        
    outbounds = []
    
    # 增加一个默认直接连接，很多配置需要
    outbounds.append({
        "type": "direct",
        "tag": "direct"
    })
    
    for idx, (server, port) in enumerate(nodes):
        outbound = {
            "type": "http",
            "tag": f"自动节点-{idx + 1}",
            "server": server,
            "server_port": int(port),
            "tls": {
                "enabled": True,
                "server_name": server,
                "insecure": False
            }
        }
        outbounds.append(outbound)
        
    singbox_config = {
        "outbounds": outbounds
    }
    
    with open(config.SINGBOX_CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(singbox_config, f, indent=2, ensure_ascii=False)
        
    print(f"🎉 Sing-Box 节点已写入: {config.SINGBOX_CONFIG_PATH}")
