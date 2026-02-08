package com.example.demo.car.dto.responses;

import java.time.OffsetDateTime;

public record CarResponse(
        Long id,
        String regNumber,
        String model,
        OffsetDateTime createdAt,
        Integer mileage,
        Integer releaseYear,
        String owner
) {
}
