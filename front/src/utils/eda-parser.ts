import { HistogramData, Variable, EDAData } from '../types/eda';

/**
 * Convert histogram data from ydata-profiling to Recharts format
 */
export function parseHistogramForRecharts(histogram: HistogramData): Array<{ x: number; y: number; range: string }> {
  const { counts, bin_edges } = histogram;
  
  if (!counts || !bin_edges || counts.length === 0) {
    return [];
  }

  return counts.map((count, idx) => {
    const binStart = bin_edges[idx];
    const binEnd = bin_edges[idx + 1] || bin_edges[idx];
    const binCenter = (binStart + binEnd) / 2;
    
    return {
      x: binCenter,
      y: count,
      range: `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`
    };
  });
}

/**
 * Extract statistics from a variable
 */
export function extractStatistics(variable: Variable) {
  return {
    mean: variable.mean,
    std: variable.std,
    min: variable.min,
    max: variable.max,
    percentiles: {
      p5: variable['5%'],
      p25: variable['25%'],
      p50: variable['50%'],
      p75: variable['75%'],
      p95: variable['95%']
    },
    n_missing: variable.n_missing,
    p_missing: variable.p_missing,
    n_distinct: variable.n_distinct,
    kurtosis: variable.kurtosis,
    skewness: variable.skewness
  };
}

/**
 * Format a decimal number as percentage
 */
export function formatPercentage(value: number | undefined): string {
  if (value === undefined || value === null) return '0.0%';
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Get numeric variables from variables object
 */
export function getNumericVariables(variables: Record<string, Variable>): Array<[string, Variable]> {
  return Object.entries(variables).filter(([_, variable]) => 
    variable.type === 'Numeric' && variable.mean !== undefined
  );
}

/**
 * Get categorical variables from variables object
 */
export function getCategoricalVariables(variables: Record<string, Variable>): Array<[string, Variable]> {
  return Object.entries(variables).filter(([_, variable]) => 
    variable.type === 'Categorical' || variable.value_counts_without_nan !== undefined
  );
}

/**
 * Extract box plot data from percentiles
 */
export function getBoxPlotData(variable: Variable) {
  if (!variable['25%'] || !variable['50%'] || !variable['75%']) {
    return null;
  }

  return {
    min: variable.min || variable['5%'],
    q1: variable['25%'],
    median: variable['50%'],
    q3: variable['75%'],
    max: variable.max || variable['95%'],
    iqr: variable.iqr
  };
}

/**
 * Parse correlation matrix for heatmap visualization
 * Handles ydata-profiling format: array of objects where each object is a row
 */
export function parseCorrelationMatrix(correlations: any) {
  if (!correlations || !correlations.auto || !Array.isArray(correlations.auto) || correlations.auto.length === 0) {
    return [];
  }

  const matrix = correlations.auto;
  // Get variable names from keys of first object
  const variables = Object.keys(matrix[0]);
  
  const heatmapData: Array<{
    x: string;
    y: string;
    value: number;
  }> = [];

  // Iterate through rows (matrix array) and columns (keys in each object)
  matrix.forEach((row, rowIndex) => {
    const varY = variables[rowIndex]; // Y-axis variable
    variables.forEach(varX => {
      const value = row[varX];
      if (value !== undefined && value !== null && !isNaN(value)) {
        heatmapData.push({
          x: varX,
          y: varY,
          value: value
        });
      }
    });
  });

  return heatmapData;
}

/**
 * Get variables with missing values
 */
export function getVariablesWithMissing(edaData: EDAData): Array<{ name: string; count: number; percentage: number }> {
  const variablesWithMissing: Array<{ name: string; count: number; percentage: number }> = [];

  Object.entries(edaData.variables).forEach(([name, variable]) => {
    if (variable.n_missing > 0) {
      variablesWithMissing.push({
        name,
        count: variable.n_missing,
        percentage: (variable.n_missing / edaData.table.n) * 100
      });
    }
  });

  return variablesWithMissing.sort((a, b) => b.count - a.count);
}

/**
 * Calculate type distribution for pie chart
 */
export function getTypeDistribution(edaData: EDAData) {
  return Object.entries(edaData.table.types).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: ((count / edaData.table.n_var) * 100).toFixed(1)
  }));
}

/**
 * Get missing data statistics
 */
export function getMissingDataStats(edaData: EDAData) {
  return {
    total: edaData.table.n_cells_missing,
    percentage: (edaData.table.p_cells_missing * 100).toFixed(2),
    variablesAffected: Object.values(edaData.variables).filter(v => v.n_missing > 0).length
  };
}
