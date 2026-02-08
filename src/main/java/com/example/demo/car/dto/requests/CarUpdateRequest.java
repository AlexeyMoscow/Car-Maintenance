package com.example.demo.car.dto.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record CarUpdateRequest(
        @Size(max = 32) String regNumber,
        @Size(max = 100) String model,
        @Min(0) Integer mileage,
        @Min(1900) Integer releaseYear,
        @Size(max = 200) String owner
) {
}
