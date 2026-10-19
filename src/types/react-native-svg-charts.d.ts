declare module 'react-native-svg-charts' {
  import type { ComponentType, ReactNode } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export interface ChartContentInset {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }

  export interface ChartSvg {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
  }

  export interface ChartAccessorArgs {
    item: number;
    index: number;
  }

  export type ChartValueAccessor = (args: ChartAccessorArgs) => number;

  /** Props the chart injects into its children (all optional — they exist only at runtime). */
  export interface ChartChildProps {
    data?: number[];
    ticks?: number[];
    x?: (index: number) => number;
    y?: (value: number) => number;
    width?: number;
    height?: number;
    bandwidth?: number;
  }

  export interface BarChartProps {
    data: number[];
    style?: StyleProp<ViewStyle>;
    svg?: ChartSvg;
    contentInset?: ChartContentInset;
    numberOfTicks?: number;
    spacingInner?: number;
    spacingOuter?: number;
    yMin?: number;
    yMax?: number;
    gridMin?: number;
    gridMax?: number;
    clamp?: boolean;
    children?: ReactNode;
  }

  export interface YAxisProps {
    data: number[];
    style?: StyleProp<ViewStyle>;
    svg?: ChartSvg;
    contentInset?: { top?: number; bottom?: number };
    numberOfTicks?: number;
    formatLabel?: (value: number, index: number) => string;
    min?: number;
    max?: number;
    yAccessor?: ChartValueAccessor;
    children?: ReactNode;
  }

  export interface GridProps {
    direction?: 'VERTICAL' | 'HORIZONTAL' | 'BOTH';
    svg?: ChartSvg;
    belowChart?: boolean;
  }

  export const BarChart: ComponentType<BarChartProps>;
  export const YAxis: ComponentType<YAxisProps>;
  export const Grid: ComponentType<GridProps>;
}
