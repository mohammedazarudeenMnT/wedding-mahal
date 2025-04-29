export async function getHotelDetails() {
  try {
    const response = await fetch('/api/hotelDetails', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch hotel details');
    }

    const data = await response.json();
    return data.hotelData;
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    return null;
  }
}