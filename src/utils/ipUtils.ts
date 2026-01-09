/**
 * Utility functions để lấy và xử lý IP address
 */

/**
 * Lấy IP address từ một service API công khai
 * Sử dụng ipify.org API (free, không cần API key)
 */
export async function getClientIP(): Promise<string | null> {
  try {
    // Thử nhiều service để đảm bảo reliability
    const services = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://ipapi.co/json/',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Thêm timeout để tránh hang
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        // ipify.org và ipapi.co đều trả về { ip: "..." }
        if (data.ip) {
          return data.ip;
        }
      } catch (error) {
        // Không log error để tránh spam console
        continue;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Lấy IP address với retry mechanism
 */
export async function getClientIPWithRetry(maxRetries: number = 2): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const ip = await getClientIP();
    if (ip) {
      return ip;
    }
    
    // Đợi một chút trước khi retry, nhưng không quá lâu
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  
  return null;
}

