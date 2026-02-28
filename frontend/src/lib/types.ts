export type Car = {
  id: number;
  regNumber: string;
  model: string;
  owner?: string | null;
  releaseYear?: number | null;
  mileage?: number | null;
  createdAt?: string | null;
  nextServiceDueKm?: number | null;
  nextServiceDueDate?: string | null;
};

export type CarCreate = {
  regNumber: string;
  model: string;
  mileage?: number;
  releaseYear?: number;
  owner?: string;
};

export type ServiceRecord = {
  id: number | string;
  carId?: number;
  date?: string | null;
  type?: string | null;
  mileage?: number | null;
  notes?: string | null;
  cost?: number | null;
};

export type ServiceRecordCreate = {
  date: string;
  type: string;
  mileage: number;
  notes?: string;
  cost?: number;
};
