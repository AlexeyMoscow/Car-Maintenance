create table if not exists car (
    id bigserial primary key,
    reg_number varchar(32) not null unique,
    model varchar(100) not null,
    created_at timestamptz not null default now()
    );