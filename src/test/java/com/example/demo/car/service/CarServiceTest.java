package com.example.demo.car.service;

import com.example.demo.car.dto.requests.CarCreateRequest;
import com.example.demo.car.dto.requests.CarUpdateRequest;
import com.example.demo.car.dto.responses.CarResponse;
import com.example.demo.car.entity.Car;
import com.example.demo.car.repository.CarRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarServiceTest {

    @Mock
    private CarRepository repo;

    @InjectMocks
    private CarService service;

    @Test
    void create_throwsConflictWhenRegNumberExists() {
        CarCreateRequest req = new CarCreateRequest("A123BC", "Civic", 120000, 2012, "Alex");
        when(repo.existsByRegNumber("A123BC")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.create(req));

        assertEquals(HttpStatus.CONFLICT.value(), ex.getStatusCode().value());
        assertEquals("Car with regNumber already exists", ex.getReason());
        verify(repo, never()).save(any(Car.class));
    }

    @Test
    void create_savesAndReturnsResponse() {
        CarCreateRequest req = new CarCreateRequest("A123BC", "Civic", 120000, 2012, "Alex");
        when(repo.existsByRegNumber("A123BC")).thenReturn(false);

        Car saved = car(10L, "A123BC", "Civic", time("2024-01-01T10:00:00Z"), 120000, 2012, "Alex");
        when(repo.save(any(Car.class))).thenReturn(saved);

        CarResponse response = service.create(req);

        ArgumentCaptor<Car> captor = ArgumentCaptor.forClass(Car.class);
        verify(repo).save(captor.capture());
        Car toSave = captor.getValue();
        assertThat(toSave.getRegNumber()).isEqualTo("A123BC");
        assertThat(toSave.getModel()).isEqualTo("Civic");
        assertThat(toSave.getMileage()).isEqualTo(120000);
        assertThat(toSave.getReleaseYear()).isEqualTo(2012);
        assertThat(toSave.getOwner()).isEqualTo("Alex");

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.regNumber()).isEqualTo("A123BC");
        assertThat(response.model()).isEqualTo("Civic");
        assertThat(response.createdAt()).isEqualTo(time("2024-01-01T10:00:00Z"));
        assertThat(response.mileage()).isEqualTo(120000);
        assertThat(response.releaseYear()).isEqualTo(2012);
        assertThat(response.owner()).isEqualTo("Alex");
    }

    @Test
    void get_throwsNotFoundWhenMissing() {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.get(99L));

        assertEquals(HttpStatus.NOT_FOUND.value(), ex.getStatusCode().value());
        assertEquals("Car not found", ex.getReason());
    }

    @Test
    void get_returnsResponse() {
        Car car = car(5L, "B777OP", "Accord", time("2023-10-10T11:30:00Z"), 50000, 2020, "Mia");
        when(repo.findById(5L)).thenReturn(Optional.of(car));

        CarResponse response = service.get(5L);

        assertThat(response.id()).isEqualTo(5L);
        assertThat(response.regNumber()).isEqualTo("B777OP");
        assertThat(response.model()).isEqualTo("Accord");
        assertThat(response.createdAt()).isEqualTo(time("2023-10-10T11:30:00Z"));
        assertThat(response.mileage()).isEqualTo(50000);
        assertThat(response.releaseYear()).isEqualTo(2020);
        assertThat(response.owner()).isEqualTo("Mia");
    }

    @Test
    void list_callsRepoWithSortAndMapsResults() {
        Car first = car(2L, "C001AA", "A3", time("2023-01-01T00:00:00Z"), 40000, 2018, "Kim");
        Car second = car(1L, "C002AA", "A4", time("2022-01-01T00:00:00Z"), 80000, 2016, "Sam");
        when(repo.findAll(any(Sort.class))).thenReturn(List.of(first, second));

        List<CarResponse> responses = service.list();

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(repo).findAll(sortCaptor.capture());
        Sort sort = sortCaptor.getValue();
        assertThat(sort.getOrderFor("id")).isNotNull();
        assertThat(sort.getOrderFor("id").getDirection()).isEqualTo(Sort.Direction.DESC);

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).id()).isEqualTo(2L);
        assertThat(responses.get(1).id()).isEqualTo(1L);
    }

    @Test
    void update_throwsNotFoundWhenMissing() {
        when(repo.findById(7L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(7L,
                new CarUpdateRequest(null, "Model X", null, null, null)));

        assertEquals(HttpStatus.NOT_FOUND.value(), ex.getStatusCode().value());
        assertEquals("Car not found", ex.getReason());
    }

    @Test
    void update_throwsConflictWhenRegNumberTaken() {
        Car existing = car(3L, "D111DD", "S60", time("2021-06-01T12:00:00Z"), 60000, 2017, "Olga");
        when(repo.findById(3L)).thenReturn(Optional.of(existing));
        when(repo.existsByRegNumber("D222DD")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(3L,
                new CarUpdateRequest("D222DD", null, null, null, null)));

        assertEquals(HttpStatus.CONFLICT.value(), ex.getStatusCode().value());
        assertEquals("Car with regNumber already exists", ex.getReason());
        verify(repo, never()).save(any(Car.class));
    }

    @Test
    void update_allowsSameRegNumberWithoutExistCheck() {
        Car existing = car(4L, "E999EE", "Octavia", time("2020-01-01T00:00:00Z"), 70000, 2015, "Ivan");
        when(repo.findById(4L)).thenReturn(Optional.of(existing));
        when(repo.save(any(Car.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CarUpdateRequest req = new CarUpdateRequest("E999EE", "Octavia RS", null, null, null);
        CarResponse response = service.update(4L, req);

        verify(repo, never()).existsByRegNumber(anyString());
        assertThat(response.model()).isEqualTo("Octavia RS");
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        Car existing = car(6L, "F123FF", "Focus", time("2019-05-20T08:00:00Z"), 90000, 2014, "Paul");
        when(repo.findById(6L)).thenReturn(Optional.of(existing));
        when(repo.existsByRegNumber("F777FF")).thenReturn(false);

        Car updated = car(6L, "F777FF", "Fiesta", time("2019-05-20T08:00:00Z"), 95000, 2015, "Paul");
        when(repo.save(any(Car.class))).thenReturn(updated);

        CarUpdateRequest req = new CarUpdateRequest("F777FF", "Fiesta", 95000, 2015, null);
        CarResponse response = service.update(6L, req);

        ArgumentCaptor<Car> captor = ArgumentCaptor.forClass(Car.class);
        verify(repo).save(captor.capture());
        Car toSave = captor.getValue();
        assertThat(toSave.getRegNumber()).isEqualTo("F777FF");
        assertThat(toSave.getModel()).isEqualTo("Fiesta");
        assertThat(toSave.getMileage()).isEqualTo(95000);
        assertThat(toSave.getReleaseYear()).isEqualTo(2015);
        assertThat(toSave.getOwner()).isEqualTo("Paul");

        assertThat(response.regNumber()).isEqualTo("F777FF");
        assertThat(response.model()).isEqualTo("Fiesta");
        assertThat(response.mileage()).isEqualTo(95000);
        assertThat(response.releaseYear()).isEqualTo(2015);
        assertThat(response.owner()).isEqualTo("Paul");
    }

    @Test
    void delete_throwsNotFoundWhenMissing() {
        when(repo.existsById(11L)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.delete(11L));

        assertEquals(HttpStatus.NOT_FOUND.value(), ex.getStatusCode().value());
        assertEquals("Car not found", ex.getReason());
        verify(repo, never()).deleteById(anyLong());
    }

    @Test
    void delete_deletesWhenExists() {
        when(repo.existsById(12L)).thenReturn(true);

        service.delete(12L);

        verify(repo).deleteById(12L);
    }

    private static Car car(Long id,
                           String regNumber,
                           String model,
                           OffsetDateTime createdAt,
                           Integer mileage,
                           Integer releaseYear,
                           String owner) {
        Car car = new Car();
        car.setRegNumber(regNumber);
        car.setModel(model);
        car.setMileage(mileage);
        car.setReleaseYear(releaseYear);
        car.setOwner(owner);
        setField(car, "id", id);
        setField(car, "createdAt", createdAt);
        return car;
    }

    private static OffsetDateTime time(String value) {
        return OffsetDateTime.parse(value);
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new IllegalStateException("Failed to set field: " + fieldName, e);
        }
    }
}
