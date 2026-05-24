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
  source_url: string | null
  // Technical specs (extracted from listing details table)
  mileage: number | null
  condition: string | null
  first_registration: string | null
  fuel_type: string | null
  power_hp: number | null
  transmission: string | null
  body_type: string | null
  doors: number | null
  exterior_color: string | null
  interior_material: string | null
  created_at: string
  updated_at: string
}

export type CarInsert = Omit<Car, 'id' | 'created_at' | 'updated_at'>
export type CarUpdate = Partial<CarInsert>

export const DESTINATION_COUNTRIES = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Bolivia',
  'Brazil',
  'Canada',
  'Chile',
  'Colombia',
  'Denmark',
  'Ecuador',
  'Finland',
  'France',
  'Germany',
  'Italy',
  'Japan',
  'Kuwait',
  'Netherlands',
  'Norway',
  'Paraguay',
  'Peru',
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
  'Uruguay',
  'Venezuela',
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
