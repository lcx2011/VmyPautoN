import sys
from tester import test_proxies
from scraper import run_smart_automation
from converter import extract_nodes, update_clash_yaml, update_singbox_json

def main():
    print("▶️ 开始 VPN 自动维护脚本...")
    
    # 1. 尝试测试现有节点
    is_alive = test_proxies()
    
    # 2. 如果节点有效，不爬取，直接退出
    if is_alive:
        print("🎉 现有节点有效，无需重新获取。任务完成！")
        sys.exit(0)
        
    print("⚠️ 节点已失效或不存在，开始运行浏览器获取新节点...")
    try:
        # headless=True 适合 GitHub Actions 运行
        # 如果你想在本机看界面调试，可以把它改成 headless=False
        raw_data = run_smart_automation(headless=True)
        
        nodes = extract_nodes(raw_data)
        if not nodes:
            print("❌ 获取到的节点为空，请检查报错！")
            sys.exit(1)
            
        update_clash_yaml(nodes)
        update_singbox_json(nodes)
        
        print("🎉 新节点获取并写入成功！")
        
        # 获取后测一遍
        print("\n=== 新节点测试 ===")
        test_proxies()
        
    except Exception as e:
        print(f"❌ 运行出错: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 强制更新模式
    if len(sys.argv) > 1 and sys.argv[1] == "--force-update":
         print("🔄 强制更新模式...")
         try:
             raw_data = run_smart_automation(headless=True)
             nodes = extract_nodes(raw_data)
             update_clash_yaml(nodes)
             update_singbox_json(nodes)
             test_proxies()
         except Exception as e:
             print(e)
             sys.exit(1)
    else:
        main()
