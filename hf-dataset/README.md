---
dataset_info:
  features:
  - name: agent
    dtype: large_string
  - name: agent_name
    dtype: large_string
  - name: average_action_count
    dtype: float64
  - name: average_agent_cost
    dtype: float64
  - name: average_benchmark_cost
    dtype: float64
  - name: average_invalid_action_count
    dtype: float64
  - name: average_invalid_action_percent
    dtype: float64
  - name: average_score
    dtype: float64
  - name: average_steps
    dtype: float64
  - name: benchmark
    dtype: large_string
  - name: benchmark_name
    dtype: large_string
  - name: benchmark_score
    dtype: float64
  - name: completed_sessions
    dtype: float64
  - name: incomplete_sessions
    dtype: float64
  - name: missing_sessions
    dtype: float64
  - name: model
    dtype: large_string
  - name: model_name
    dtype: large_string
  - name: percent_error
    dtype: float64
  - name: percent_finished
    dtype: float64
  - name: percent_finished_successful
    dtype: float64
  - name: percent_finished_unsuccessful
    dtype: float64
  - name: percent_successful
    dtype: float64
  - name: percent_unfinished
    dtype: float64
  - name: planned_sessions
    dtype: int64
  - name: subset_name
    dtype: large_string
  - name: successful_sessions
    dtype: int64
  - name: total_agent_cost
    dtype: float64
  - name: total_benchmark_cost
    dtype: float64
  - name: total_run_cost
    dtype: float64
  - name: total_sessions
    dtype: int64
  splits:
  - name: train
    num_bytes: 32724
    num_examples: 90
  download_size: 22410
  dataset_size: 32724
configs:
- config_name: default
  data_files:
  - split: train
    path: data/train-*
---
