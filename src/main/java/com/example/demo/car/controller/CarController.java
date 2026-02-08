package com.example.demo.car.controller;

import com.example.demo.car.dto.requests.CarCreateRequest;
import com.example.demo.car.dto.requests.CarUpdateRequest;
import com.example.demo.car.dto.responses.CarResponse;
import com.example.demo.car.service.CarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CarResponse create(@Valid @RequestBody CarCreateRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public CarResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping
    public List<CarResponse> list() {
        return service.list();
    }

    @PutMapping("/{id}")
    public CarResponse update(@PathVariable Long id, @Valid @RequestBody CarUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
