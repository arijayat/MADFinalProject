import * as Location from 'expo-location';

export type UserPosition = {
  latitude: number;
  longitude: number;
};

export async function getCurrentPosition(): Promise<UserPosition> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to find schools near you.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
