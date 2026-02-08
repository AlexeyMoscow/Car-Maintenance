package com.example.demo.car.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Getter
@Table(name = "car")
public class Car {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Setter
    @Column(name = "reg_number", nullable = false, unique = true, length = 32)
    private String regNumber;

    @Setter
    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private OffsetDateTime createdAt;

    @Setter
    private Integer mileage;

    @Setter
    @Column(name = "release_year")
    private Integer releaseYear;

    @Setter
    @Column(length = 200)
    private String owner;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
