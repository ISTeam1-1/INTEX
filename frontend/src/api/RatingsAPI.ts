import { Rating } from '../types/Rating';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/ratings';

export const getRatings = async (): Promise<Rating[] | null> => {
  try {
    const res = await fetch(`${API_URL}/all`);
    if (!res.ok)
      throw new Error(`Failed to fetch ratings. Status: ${res.status}`);
    const data = await res.json();
    return data.ratings ?? [];
  } catch (error) {
    console.error('getRatings error:', error);
    return null;
  }
};

export const getRating = async (
  userId: number,
  showId: string
): Promise<Rating | null> => {
  try {
    const res = await fetch(`${API_URL}/${userId}/${showId}`);
    if (!res.ok) throw new Error(`Rating not found: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('getRating error:', error);
    return null;
  }
};

export const addRating = async (rating: Rating): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rating),
    });

    return res.ok;
  } catch (error) {
    console.error('addRating error:', error);
    return false;
  }
};

export const updateRating = async (
  userId: number,
  showId: string,
  rating: Rating
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/update/${userId}/${showId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rating),
    });

    return res.ok;
  } catch (error) {
    console.error('updateRating error:', error);
    return false;
  }
};

export const deleteRating = async (
  userId: number,
  showId: string
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/delete/${userId}/${showId}`, {
      method: 'DELETE',
    });

    return res.ok;
  } catch (error) {
    console.error('deleteRating error:', error);
    return false;
  }
};
