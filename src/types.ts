export type Ad = {
  id: string;
  lat: number | null;
  lng: number | null;
  city: string;
  quartier_name: string | null;
  postal_code: string | null;
  description: string | null;
};

export type LatLng = {
  lat: number;
  lng: number;
};
