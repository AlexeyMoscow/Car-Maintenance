"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createServiceRecord,
  createCar,
  deleteCar,
  listCars,
  listServiceHistory,
} from "@/lib/api";
import type { Car, CarCreate, ServiceRecord, ServiceRecordCreate } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const numberFormat = new Intl.NumberFormat("en-US");

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const isOverdue = (car: Car, today: Date) => {
  const dueByKm =
    typeof car.nextServiceDueKm === "number" &&
    typeof car.mileage === "number" &&
    car.mileage >= car.nextServiceDueKm;
  const dueByDate = car.nextServiceDueDate
    ? new Date(car.nextServiceDueDate).getTime() < today.getTime()
    : false;
  return Boolean(dueByKm || dueByDate);
};

type ServiceFormState = {
  date: string;
  type: string;
  mileage: string;
  notes: string;
  cost: string;
};

type CarFormState = {
  regNumber: string;
  model: string;
  mileage: string;
  releaseYear: string;
  owner: string;
};

const emptyForm = (car?: Car | null, defaults?: Partial<ServiceFormState>): ServiceFormState => ({
  date: todayIso(),
  type: "",
  mileage: car?.mileage?.toString() ?? "",
  notes: "",
  cost: "",
  ...defaults,
});

const emptyCarForm = (defaults?: Partial<CarFormState>): CarFormState => ({
  regNumber: "",
  model: "",
  mileage: "",
  releaseYear: "",
  owner: "",
  ...defaults,
});

export default function Page() {
  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [history, setHistory] = useState<ServiceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);
  const [formState, setFormState] = useState<ServiceFormState>(emptyForm());
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [carDialogSubmitting, setCarDialogSubmitting] = useState(false);
  const [carFormState, setCarFormState] = useState<CarFormState>(emptyCarForm());

  const selectedCar = useMemo(
    () => cars.find((car) => car.id === selectedCarId) ?? null,
    [cars, selectedCarId]
  );

  const filteredCars = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cars;
    return cars.filter((car) => {
      return (
        car.regNumber.toLowerCase().includes(normalized) ||
        car.model.toLowerCase().includes(normalized)
      );
    });
  }, [cars, query]);

  const historyForSelected = useMemo(() => {
    return [...history].sort((a, b) => {
      const dateA = a.date ?? "";
      const dateB = b.date ?? "";
      if (dateA === dateB) return 0;
      return dateA < dateB ? 1 : -1;
    });
  }, [history]);

  const nextServiceKm = useMemo(() => {
    if (!selectedCar) return null;
    if (typeof selectedCar.nextServiceDueKm === "number") {
      return selectedCar.nextServiceDueKm;
    }
    if (typeof selectedCar.mileage === "number") {
      return selectedCar.mileage + 10000;
    }
    return null;
  }, [selectedCar]);

  const loadCars = async () => {
    setCarsLoading(true);
    setErrorMessage(null);
    try {
      const data = await listCars();
      setCars(data);
      setSelectedCarId((prev) => {
        if (prev && data.some((car) => car.id === prev)) {
          return prev;
        }
        return data[0]?.id ?? null;
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.details || err.message : "Failed to load cars";
      setErrorMessage(message);
    } finally {
      setCarsLoading(false);
    }
  };

  const loadHistory = async (carId: number) => {
    setHistoryLoading(true);
    setErrorMessage(null);
    try {
      const data = await listServiceHistory(carId);
      setHistory(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.details || err.message : "Failed to load history";
      setErrorMessage(message);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    if (selectedCarId !== null) {
      loadHistory(selectedCarId);
    } else {
      setHistory([]);
    }
  }, [selectedCarId]);

  const openDialog = (defaults?: Partial<ServiceFormState>) => {
    setFormState(emptyForm(selectedCar, defaults));
    setDialogOpen(true);
  };

  const openCarDialog = (defaults?: Partial<CarFormState>) => {
    setCarFormState(emptyCarForm(defaults));
    setCarDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCar) {
      setErrorMessage("Select a car before adding service records.");
      return;
    }

    const mileageValue = Number(formState.mileage);
    const costValue = Number(formState.cost);

    if (Number.isNaN(mileageValue) || mileageValue < 0) {
      setErrorMessage("Mileage must be a valid number.");
      return;
    }
    if (Number.isNaN(costValue) || costValue < 0) {
      setErrorMessage("Cost must be a valid number.");
      return;
    }

    const payload: ServiceRecordCreate = {
      date: formState.date,
      type: formState.type.trim(),
      mileage: mileageValue,
      notes: formState.notes.trim(),
      cost: costValue,
    };

    setDialogSubmitting(true);
    setErrorMessage(null);
    try {
      await createServiceRecord(selectedCar.id, payload);
      setDialogOpen(false);
      await Promise.all([loadHistory(selectedCar.id), loadCars()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.details || err.message : "Failed to create record";
      setErrorMessage(message);
    } finally {
      setDialogSubmitting(false);
    }
  };

  const handleCarSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const mileageValue =
      carFormState.mileage.trim() === "" ? undefined : Number(carFormState.mileage);
    const releaseYearValue =
      carFormState.releaseYear.trim() === "" ? undefined : Number(carFormState.releaseYear);

    if (mileageValue !== undefined && (Number.isNaN(mileageValue) || mileageValue < 0)) {
      setErrorMessage("Mileage must be a valid number.");
      return;
    }
    if (
      releaseYearValue !== undefined &&
      (Number.isNaN(releaseYearValue) || releaseYearValue < 1900)
    ) {
      setErrorMessage("Release year must be a valid number.");
      return;
    }

    const payload: CarCreate = {
      regNumber: carFormState.regNumber.trim(),
      model: carFormState.model.trim(),
      mileage: mileageValue,
      releaseYear: releaseYearValue,
      owner: carFormState.owner.trim() || undefined,
    };

    if (!payload.regNumber || !payload.model) {
      setErrorMessage("Reg number and model are required.");
      return;
    }

    setCarDialogSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await createCar(payload);
      setCarDialogOpen(false);
      await loadCars();
      if (created?.id) {
        setSelectedCarId(created.id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.details || err.message : "Failed to create car";
      setErrorMessage(message);
    } finally {
      setCarDialogSubmitting(false);
    }
  };

  const handleDeleteCar = async () => {
    if (!selectedCar) return;
    const confirmed = window.confirm(
      `Delete ${selectedCar.regNumber}? This cannot be undone.`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    try {
      await deleteCar(selectedCar.id);
      const remaining = cars.filter((car) => car.id !== selectedCar.id);
      setSelectedCarId(remaining[0]?.id ?? null);
      await loadCars();
      setHistory([]);
    } catch (err) {
      const message = err instanceof ApiError ? err.details || err.message : "Failed to delete car";
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F5F5F5]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#BDBDBD]">Service Dashboard</p>
            <h1 className="text-2xl font-semibold">Car Maintenance</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-md border-[#FFCD00] bg-transparent text-[#FFCD00]"
              onClick={() => openCarDialog()}
            >
              Add car
            </Button>
            <Button
              onClick={() => openDialog({ type: "" })}
              className="rounded-md bg-[#FFCD00] text-[#0B0B0B] hover:bg-[#E6B800]"
              disabled={!selectedCar}
            >
              Add service record
            </Button>
          </div>
        </header>

        {errorMessage ? (
          <div className="mt-4 rounded-md border border-[#E5484D] bg-[#1A0E0F] px-4 py-3 text-sm text-[#E5484D]">
            {errorMessage}
          </div>
        ) : null}

        <main className="flex flex-1 flex-col gap-6 pt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,1.4fr]">
            <Card className="rounded-md border border-[#2A2A2A] bg-[#141414]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cars</CardTitle>
                <p className="text-sm text-[#BDBDBD]">
                  {carsLoading ? "Loading vehicles..." : `${filteredCars.length} vehicles tracked`}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by reg number or model..."
                />
                <Separator className="bg-[#2A2A2A]" />
                <ScrollArea className="h-[360px] pr-3 lg:h-[520px]">
                  <div className="flex flex-col gap-3">
                    {carsLoading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={`skeleton-car-${index}`}
                          className="flex flex-col gap-3 rounded-md border border-[#2A2A2A] bg-[#101010] px-4 py-4"
                        >
                          <div className="h-4 w-24 animate-pulse rounded bg-[#1F1F1F]" />
                          <div className="h-3 w-40 animate-pulse rounded bg-[#1F1F1F]" />
                          <div className="h-3 w-28 animate-pulse rounded bg-[#1F1F1F]" />
                        </div>
                      ))
                    ) : filteredCars.length === 0 ? (
                      <div className="rounded-md border border-[#2A2A2A] bg-[#101010] p-4 text-sm text-[#BDBDBD]">
                        No cars match your search.
                      </div>
                    ) : (
                      filteredCars.map((car) => {
                        const overdue = isOverdue(car, new Date());
                        const selected = car.id === selectedCarId;
                        return (
                          <button
                            key={car.id}
                            type="button"
                            onClick={() => setSelectedCarId(car.id)}
                            className={`flex flex-col gap-2 rounded-md border border-[#2A2A2A] bg-[#101010] px-4 py-3 text-left transition hover:bg-[#171717] ${
                              selected ? "border-l-4 border-l-[#FFCD00] bg-[#1A1A1A]" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-[#BDBDBD]">Reg</p>
                                <p className="text-base font-semibold text-[#F5F5F5]">
                                  {car.regNumber}
                                </p>
                              </div>
                              <Badge
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                  overdue
                                    ? "border-[#E5484D] bg-transparent text-[#E5484D]"
                                    : "border-[#FFCD00] bg-transparent text-[#FFCD00]"
                                }`}
                              >
                                {overdue ? "OVERDUE" : "OK"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-[#BDBDBD]">Model</p>
                              <p className="text-sm text-[#F5F5F5]">{car.model}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#BDBDBD]">
                              <span>
                                {typeof car.mileage === "number"
                                  ? `${numberFormat.format(car.mileage)} km`
                                  : "Mileage —"}
                              </span>
                              <span>
                                {typeof car.releaseYear === "number" ? `Year ${car.releaseYear}` : "Year —"}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="rounded-md border border-[#2A2A2A] bg-[#141414]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Selected car</CardTitle>
                <p className="text-sm text-[#BDBDBD]">Asset details and next service window</p>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-6">
                {!selectedCar ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#BDBDBD]">
                    Select a car to view details.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Reg number</p>
                        <p className="text-base font-semibold text-[#F5F5F5]">
                          {selectedCar.regNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Model</p>
                        <p className="text-base text-[#F5F5F5]">{selectedCar.model}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Owner</p>
                        <p className="text-base text-[#F5F5F5]">{selectedCar.owner ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Release year</p>
                        <p className="text-base text-[#F5F5F5]">
                          {selectedCar.releaseYear ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Mileage</p>
                        <p className="text-base text-[#F5F5F5]">
                          {typeof selectedCar.mileage === "number"
                            ? `${numberFormat.format(selectedCar.mileage)} km`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Created at</p>
                        <p className="text-base text-[#F5F5F5]">{formatDate(selectedCar.createdAt)}</p>
                      </div>
                    </div>

                    <div className="rounded-md border border-[#2A2A2A] bg-[#101010] p-4">
                      <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Next service</p>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-[#F5F5F5]">
                        <span>
                          Due at {nextServiceKm ? `${numberFormat.format(nextServiceKm)} km` : "—"}
                        </span>
                        <span>
                          Due date {selectedCar.nextServiceDueDate ? formatDate(selectedCar.nextServiceDueDate) : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" className="rounded-md border-[#FFCD00] bg-transparent text-[#FFCD00]">
                        Edit car
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeleteCar}
                        className="rounded-md border-[#E5484D] bg-transparent text-[#E5484D] hover:bg-[#1A0E0F]"
                      >
                        Delete car
                      </Button>
                      <Button
                        onClick={() => openDialog({ type: "Service" })}
                        className="rounded-md bg-[#FFCD00] text-[#0B0B0B] hover:bg-[#E6B800]"
                      >
                        Mark serviced
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-md border border-[#2A2A2A] bg-[#141414]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Service history</CardTitle>
              <p className="text-sm text-[#BDBDBD]">Recent maintenance records for this asset</p>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[280px] pr-2">
                {historyLoading ? (
                  <div className="space-y-3 py-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`skeleton-history-${index}`}
                        className="h-8 w-full animate-pulse rounded bg-[#1F1F1F]"
                      />
                    ))}
                  </div>
                ) : historyForSelected.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#BDBDBD]">
                    No service records yet. Add a service record to begin tracking.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2A2A]">
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyForSelected.map((record) => (
                        <TableRow key={record.id} className="border-[#2A2A2A]">
                          <TableCell>{formatDate(record.date ?? undefined)}</TableCell>
                          <TableCell>{record.type ?? "—"}</TableCell>
                          <TableCell>
                            {typeof record.mileage === "number"
                              ? `${numberFormat.format(record.mileage)} km`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-[#BDBDBD]">{record.notes ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {typeof record.cost === "number" ? `$${numberFormat.format(record.cost)}` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add service record</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="service-date">
                Date
              </label>
              <Input
                id="service-date"
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="service-type">
                Type
              </label>
              <Input
                id="service-type"
                value={formState.type}
                onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
                placeholder="Service type"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="service-mileage">
                  Mileage
                </label>
                <Input
                  id="service-mileage"
                  type="number"
                  min={0}
                  value={formState.mileage}
                  onChange={(event) => setFormState((prev) => ({ ...prev, mileage: event.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="service-cost">
                  Cost
                </label>
                <Input
                  id="service-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formState.cost}
                  onChange={(event) => setFormState((prev) => ({ ...prev, cost: event.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="service-notes">
                Notes
              </label>
              <Input
                id="service-notes"
                value={formState.notes}
                onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notes"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-md border-[#FFCD00] bg-transparent text-[#FFCD00]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={dialogSubmitting}>
                {dialogSubmitting ? "Saving..." : "Save record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={carDialogOpen} onOpenChange={setCarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add car</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCarSubmit}>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="car-reg">
                Reg number
              </label>
              <Input
                id="car-reg"
                value={carFormState.regNumber}
                onChange={(event) => setCarFormState((prev) => ({ ...prev, regNumber: event.target.value }))}
                placeholder="CAT-0000"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="car-model">
                Model
              </label>
              <Input
                id="car-model"
                value={carFormState.model}
                onChange={(event) => setCarFormState((prev) => ({ ...prev, model: event.target.value }))}
                placeholder="Toyota Hilux 2.8D"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="car-mileage">
                  Mileage
                </label>
                <Input
                  id="car-mileage"
                  type="number"
                  min={0}
                  value={carFormState.mileage}
                  onChange={(event) => setCarFormState((prev) => ({ ...prev, mileage: event.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="car-year">
                  Release year
                </label>
                <Input
                  id="car-year"
                  type="number"
                  min={1900}
                  value={carFormState.releaseYear}
                  onChange={(event) => setCarFormState((prev) => ({ ...prev, releaseYear: event.target.value }))}
                  placeholder="2024"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-[#BDBDBD]" htmlFor="car-owner">
                Owner
              </label>
              <Input
                id="car-owner"
                value={carFormState.owner}
                onChange={(event) => setCarFormState((prev) => ({ ...prev, owner: event.target.value }))}
                placeholder="Owner name"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCarDialogOpen(false)}
                className="rounded-md border-[#FFCD00] bg-transparent text-[#FFCD00]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={carDialogSubmitting}>
                {carDialogSubmitting ? "Saving..." : "Save car"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
