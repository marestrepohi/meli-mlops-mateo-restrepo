// Types for ydata-profiling JSON structure

export interface EDAAnalysis {
  title: string;
  date_start: string;
  date_end: string;
}

export interface EDATable {
  n: number;
  n_var: number;
  memory_size: number;
  record_size?: number; // Optional - computed from memory_size/n
  n_cells_missing: number;
  n_vars_with_missing?: number; // Optional - computed from variables
  p_cells_missing: number;
  types: Record<string, number>;
  n_duplicates: number;
  p_duplicates: number;
}

export interface HistogramData {
  counts: number[];
  bin_edges: number[];
}

export interface Variable {
  type: string;
  n_distinct: number;
  n_missing: number;
  p_missing?: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  '5%'?: number;
  '25%'?: number;
  '50%'?: number;
  '75%'?: number;
  '95%'?: number;
  iqr?: number;
  cv?: number;
  kurtosis?: number;
  skewness?: number;
  histogram?: HistogramData;
  value_counts_without_nan?: Record<string, number>;
  [key: string]: any;
}

// Correlation matrix from ydata-profiling: array of objects
// Each object in array represents a row, where keys are column names
// Example: [{AGE: 1.0, B: -0.22, ...}, {AGE: -0.22, B: 1.0, ...}, ...]
export type CorrelationMatrix = Array<Record<string, number>>;

export interface Correlations {
  auto?: CorrelationMatrix;
  pearson?: CorrelationMatrix;
  spearman?: CorrelationMatrix;
  [key: string]: any;
}

export interface MissingData {
  bar?: {
    name: string;
    caption: string;
    matrix: string; // SVG string
  };
  matrix?: {
    name: string;
    caption: string;
    matrix: string; // SVG string
  };
  heatmap?: {
    name: string;
    caption: string;
    matrix: string; // SVG string
  };
}

export interface EDAData {
  analysis: EDAAnalysis;
  table: EDATable;
  variables: Record<string, Variable>;
  // Scatter plots: nested object structure
  // First key: source variable, Second key: target variable, Value: SVG string
  // Example: {CRIM: {MEDV: "<svg>...</svg>", ZN: "<svg>...</svg>"}, ...}
  scatter?: Record<string, Record<string, string>>;
  correlations?: Correlations;
  missing?: MissingData;
  alerts?: string[];
  sample?: any[];
  duplicates?: any[];
}
