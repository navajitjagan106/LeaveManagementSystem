import * as React from "react";
import { ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "../../lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type ChartConfig = Record<
    string,
    { label?: React.ReactNode; icon?: React.ComponentType; color?: string }
>;

type ChartContextProps = { config: ChartConfig };

// ── Context ────────────────────────────────────────────────────────────────

const ChartCtx = React.createContext<ChartContextProps | null>(null);

export function useChart() {
    const ctx = React.useContext(ChartCtx);
    if (!ctx) throw new Error("useChart must be inside <ChartContainer>");
    return ctx;
}

// ── ChartContainer ─────────────────────────────────────────────────────────

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ReactElement;
};

export function ChartContainer({ config, className, style, children, ...props }: ChartContainerProps) {
    const cssVars = Object.entries(config).reduce((acc, [key, val]) => {
        if (val.color) acc[`--color-${key}`] = val.color;
        return acc;
    }, {} as Record<string, string>);

    return (
        <ChartCtx.Provider value={{ config }}>
            <div
                className={cn("flex justify-center text-xs", className)}
                style={{ ...cssVars, ...style } as React.CSSProperties}
                {...props}
            >
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </ChartCtx.Provider>
    );
}

// ── ChartTooltip (pass-through) ────────────────────────────────────────────

export const ChartTooltip = Tooltip;

// ── ChartTooltipContent ────────────────────────────────────────────────────

type PayloadItem = {
    name?: string;
    dataKey?: string | number;
    value?: number;
    color?: string;
    fill?: string;
    payload?: Record<string, unknown>;
};

type ChartTooltipContentProps = {
    active?: boolean;
    payload?: PayloadItem[];
    label?: string | number;
    className?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "dot" | "line" | "dashed";
    nameKey?: string;
    labelKey?: string;
    labelFormatter?: (value: unknown, payload: PayloadItem[]) => React.ReactNode;
    labelClassName?: string;
    formatter?: (value: unknown, name: unknown, item: PayloadItem, index: number) => React.ReactNode;
    color?: string;
};

export function ChartTooltipContent({
    active,
    payload,
    label,
    className,
    hideLabel = false,
    hideIndicator = false,
    indicator = "dot",
    nameKey,
    labelFormatter,
    labelClassName,
    formatter,
    color,
}: ChartTooltipContentProps) {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
        if (hideLabel || !payload?.length) return null;
        const [item] = payload;
        const key = nameKey || String(item?.dataKey ?? item?.name ?? "");
        const cfgEntry = config[key] ?? config[String(label ?? "")];
        const displayValue = cfgEntry?.label ?? label;
        if (!displayValue) return null;
        return labelFormatter
            ? <div className={cn("font-medium", labelClassName)}>{labelFormatter(displayValue, payload)}</div>
            : <div className={cn("font-medium", labelClassName)}>{displayValue}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, nameKey]);

    if (!active || !payload?.length) return null;

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
        <div className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-xl", className)}>
            {!nestLabel ? tooltipLabel : null}
            <div className="grid gap-1.5">
                {payload.map((item, index) => {
                    const key = nameKey || String(item.name ?? item.dataKey ?? "value");
                    const cfgEntry = config[key];
                    const indicatorColor = color || String(item.payload?.fill ?? item.fill ?? item.color ?? "");

                    return (
                        <div key={index} className={cn("flex w-full flex-wrap items-stretch gap-2", indicator === "dot" && "items-center")}>
                            {formatter && item.value !== undefined && item.name ? (
                                formatter(item.value, item.name, item, index)
                            ) : (
                                <>
                                    {cfgEntry?.icon ? (
                                        <cfgEntry.icon />
                                    ) : !hideIndicator && (
                                        <span
                                            className={cn("shrink-0 rounded-[2px]", {
                                                "h-2.5 w-2.5 translate-y-[1px]": indicator === "dot",
                                                "w-1 h-full": indicator === "line",
                                                "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                                            })}
                                            style={{ background: indicatorColor }}
                                        />
                                    )}
                                    <div className={cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center")}>
                                        <div className="grid gap-1.5">
                                            {nestLabel ? tooltipLabel : null}
                                            <span className="text-gray-500">{cfgEntry?.label ?? item.name}</span>
                                        </div>
                                        {item.value !== undefined && (
                                            <span className="font-mono font-medium tabular-nums text-gray-950 ml-4">
                                                {item.value.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── ChartLegend (pass-through) ─────────────────────────────────────────────

export const ChartLegend = Legend;

// ── ChartLegendContent ─────────────────────────────────────────────────────

type LegendPayloadItem = { value?: string; dataKey?: string | number; color?: string };

type ChartLegendContentProps = React.HTMLAttributes<HTMLDivElement> & {
    payload?: LegendPayloadItem[];
    verticalAlign?: "top" | "bottom" | "middle";
    hideIcon?: boolean;
    nameKey?: string;
};

export function ChartLegendContent({
    className,
    hideIcon = false,
    payload,
    verticalAlign = "bottom",
    nameKey,
}: ChartLegendContentProps) {
    const { config } = useChart();
    if (!payload?.length) return null;

    return (
        <div className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
            {payload.map((item, i) => {
                const key = nameKey || String(item.dataKey ?? item.value ?? "");
                const cfgEntry = config[key];
                return (
                    <div key={i} className="flex items-center gap-1.5">
                        {cfgEntry?.icon && !hideIcon
                            ? <cfgEntry.icon />
                            : <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
                        }
                        <span className="text-gray-600 text-xs">{cfgEntry?.label ?? item.value}</span>
                    </div>
                );
            })}
        </div>
    );
}
