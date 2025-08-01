#!/bin/bash
echo "开始限流测试..."
for i in {1..8}
do
    echo "请求 $i:"
    response=$(curl -s -w "HTTP: %{http_code}" "http://localhost:3001/api/search?q=test")
    http_code=$(echo "$response" | grep -o 'HTTP: [0-9]*' | cut -d' ' -f2)
    echo "状态码: $http_code"
    
    if [[ $http_code == "429" ]]; then
        echo "✅ 限流生效！"
        break
    fi
    
    sleep 0.1
done
echo "限流测试完成"