export async function getHotelDetails() {
  try {
    const response = await fetch('/api/hotelDetails', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {      throw new Error('Failed to fetch mahaal details');
    }

    const data = await response.json();
    return data.hotelData;
  } catch (error) {
    console.error('Error fetching mahaal details:', error);
    return null;
  }
}