export interface Car {
  id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  description: string
  destination_countries: string[]
  photos: string[]
  created_at: string
  updated_at: string
}

export type CarInsert = Omit<Car, 'id' | 'created_at' | 'updated_at'>
export type CarUpdate = Partial<CarInsert>

export const DESTINATION_COUNTRIES = [
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Denmark',
  'Finland',
  'France',
  'Germany',
  'Italy',
  'Japan',
  'Kuwait',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Qatar',
  'Saudi Arabia',
  'South Africa',
  'Spain',
  'Sweden',
  'Switzerland',
  'UAE',
  'United Kingdom',
  'United States',
]

export const CAR_BRANDS = [
  'Alfa Romeo',
  'Aston Martin',
  'Bentley',
  'BMW',
  'Bugatti',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Citroën',
  'Daimler',
  'De Tomaso',
  'Dodge',
  'Ferrari',
  'Fiat',
  'Ford',
  'Jaguar',
  'Lamborghini',
  'Lancia',
  'Lincoln',
  'Lotus',
  'Maserati',
  'Mercedes-Benz',
  'MG',
  'Morgan',
  'Morris',
  'Oldsmobile',
  'Packard',
  'Peugeot',
  'Plymouth',
  'Pontiac',
  'Porsche',
  'Renault',
  'Rolls-Royce',
  'Rover',
  'Triumph',
  'Volkswagen',
  'Volvo',
  'Other',
]
