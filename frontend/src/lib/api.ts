import type { Car, CarCreate, ServiceRecord, ServiceRecordCreate } from "@/lib/types";

const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const normalizedBase = rawBase ? rawBase.replace(/\/$/, "") : "";
const apiBase = normalizedBase
  ? normalizedBase.endsWith("/api")
    ? normalizedBase
    : `${normalizedBase}/api`
  : "/api";

export class ApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(
      `Request failed (${response.status})`,
      response.status,
      text
    );
  }

  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new ApiError("Invalid JSON response", response.status, text);
  }
}

export async function listCars(): Promise<Car[]> {
  return request<Car[]>("/cars");
}

export async function getCar(id: number): Promise<Car> {
  return request<Car>(`/cars/${id}`);
}

export async function createCar(payload: CarCreate): Promise<Car> {
  try {
    return await request<Car>("/car", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return await request<Car>("/cars", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export async function listServiceHistory(carId: number): Promise<ServiceRecord[]> {
  try {
    return await request<ServiceRecord[]>(`/cars/${carId}/service-history`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return await request<ServiceRecord[]>(`/cars/${carId}/service-records`);
    }
    throw err;
  }
}

export async function createServiceRecord(
  carId: number,
  payload: ServiceRecordCreate
): Promise<ServiceRecord> {
  return request<ServiceRecord>(`/cars/${carId}/service-records`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
