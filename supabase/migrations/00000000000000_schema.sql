CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE suggestion_steps (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    parent_step_id bigint REFERENCES suggestion_steps(id),
    is_fork boolean DEFAULT false
);

CREATE TABLE suggestions (
    id bigserial PRIMARY KEY,
    step_id bigint REFERENCES suggestion_steps(id),
    suggestion_text text NOT NULL,
    is_random boolean DEFAULT false
);

CREATE TABLE user_choices (
    id bigserial PRIMARY KEY,
    step_id bigint REFERENCES suggestion_steps(id),
    suggestion_id bigint REFERENCES suggestions(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE forks (
    id bigserial PRIMARY KEY,
    original_step_id bigint REFERENCES suggestion_steps(id),
    forked_step_id bigint REFERENCES suggestion_steps(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE item_analysis (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    step_id bigint REFERENCES suggestion_steps(id),
    analysis_text text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_analysis_per_step UNIQUE (user_id, step_id)
);

CREATE TABLE full_item_analysis (
    user_id UUID NOT NULL,
    step_id BIGINT NOT NULL,
    analysis_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, step_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (step_id) REFERENCES suggestion_steps(id)
);

CREATE TABLE total_analysis (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    analysis_text text NOT NULL,
    created_at timestamptz DEFAULT now()
);