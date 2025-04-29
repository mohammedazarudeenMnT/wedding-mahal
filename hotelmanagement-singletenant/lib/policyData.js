export async function getPolicyData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/settings/policy`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 }, // Disable cache during debugging
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Policy API response:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.policy || !data.hotelLogo) {
      console.error('Invalid policy data:', data);
      throw new Error('Invalid policy data structure');
    }

    return {
      policy: data.policy,
      hotelLogo: data.hotelLogo
    };
    
  } catch (error) {
    console.error('Error fetching policy data:', error);
    return null;
  }
}
