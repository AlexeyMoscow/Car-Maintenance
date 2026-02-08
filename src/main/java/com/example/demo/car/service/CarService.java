package com.example.demo.car.service;

import com.example.demo.car.dto.requests.CarCreateRequest;
import com.example.demo.car.dto.requests.CarUpdateRequest;
import com.example.demo.car.dto.responses.CarResponse;
import com.example.demo.car.entity.Car;
import com.example.demo.car.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository repo;

    public CarResponse create(CarCreateRequest req) {

        if(repo.existsByRegNumber(req.regNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Car with regNumber already exists");
        }

        Car car = new Car();
        car.setRegNumber(req.regNumber());
        car.setModel(req.model());
        car.setMileage(req.mileage());
        car.setReleaseYear(req.releaseYear());
        car.setOwner(req.owner());

        return toResponse(repo.save(car));
    }

    public CarResponse get(Long id) {
       return toResponse(repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found")));
    }

    public List<CarResponse> list() {
        return repo.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream().map(this::toResponse).toList();
    }

    public CarResponse update(Long id, CarUpdateRequest req) {
        Car car = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));

        if (req.regNumber() != null && !req.regNumber().equals(car.getRegNumber())) {
            if (repo.existsByRegNumber(req.regNumber())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Car with regNumber already exists");
            }
            car.setRegNumber(req.regNumber());
        }
        if (req.model() != null) car.setModel(req.model());
        if (req.mileage() != null) car.setMileage(req.mileage());
        if (req.releaseYear() != null) car.setReleaseYear(req.releaseYear());
        if (req.owner() != null) car.setOwner(req.owner());

        return toResponse(repo.save(car));
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found");
        }
        repo.deleteById(id);
    }

    private CarResponse toResponse(Car c) {
        return new CarResponse(
                c.getId(),
                c.getRegNumber(),
                c.getModel(),
                c.getCreatedAt(),
                c.getMileage(),
                c.getReleaseYear(),
                c.getOwner()
        );
    }
}
