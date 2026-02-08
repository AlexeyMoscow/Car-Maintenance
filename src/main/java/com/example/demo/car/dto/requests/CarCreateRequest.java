package com.example.demo.car.dto.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CarCreateRequest(
        @NotBlank @Size(max = 32) String regNumber,
        @NotBlank @Size(max = 100) String model,
        @Min(0) Integer mileage,
        @Min(1900) Integer releaseYear,
        @Size(max = 200) String owner
) {
}
