package com.example.demo.car.repository;

import com.example.demo.car.entity.Car;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CarRepository extends JpaRepository<Car, Long> {
    Optional<Car> findByRegNumber(String regNumber);
    boolean existsByRegNumber(String reqNumber);
}
