import { Card, Chip, buttonVariants } from "@heroui/react";
import Link from "next/link";

import {
  ArrowRightIcon,
  ChartIcon,
  TrendDownIcon,
  TrendUpIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

const KPIS = [
  {
    label: "Monthly recurring revenue",
    value: "$482,900",
    delta: "+6.4%",
    trend: "up" as const,
    icon: WalletIcon,
  },
  {
    label: "Active customers",
    value: "3,214",
    delta: "+2.1%",
    trend: "up" as const,
    icon: UsersIcon,
  },
  {
    label: "Net revenue retention",
    value: "114%",
    delta: "+1.3 pts",
    trend: "up" as const,
    icon: ChartIcon,
  },
  {
    label: "Gross churn",
    value: "1.9%",
    delta: "-0.4 pts",
    trend: "down" as const,
    icon: TrendDownIcon,
  },
];

// Deterministic sample series for the MRR area chart (last 12 weeks).
const SERIES = [312, 305, 328, 340, 336, 358, 372, 366, 390, 410, 442, 483];

const FORECASTS = [
  { metric: "MRR", horizon: "30 days", projection: "$511k", confidence: "High" },
  { metric: "New signups", horizon: "30 days", projection: "1,180", confidence: "Medium" },
  { metric: "Churn rate", horizon: "30 days", projection: "1.7%", confidence: "High" },
  { metric: "Expansion ARR", horizon: "90 days", projection: "$1.24M", confidence: "Medium" },
];

const ACTIVITY = [
  {
    customer: "Northwind Traders",
    event: "Upgraded to Growth",
    amount: "+$490 / mo",
    when: "12m ago",
    tone: "success" as const,
  },
  {
    customer: "Aperture Science",
    event: "Usage anomaly detected",
    amount: "API calls +240%",
    when: "1h ago",
    tone: "warning" as const,
  },
  {
    customer: "Monogram Inc.",
    event: "Invoice paid",
    amount: "+$4,900",
    when: "3h ago",
    tone: "success" as const,
  },
  {
    customer: "Trailhead Co.",
    event: "Downgraded plan",
    amount: "-$120 / mo",
    when: "5h ago",
    tone: "danger" as const,
  },
  {
    customer: "Basecamp Labs",
    event: "Trial started",
    amount: "14-day trial",
    when: "8h ago",
    tone: "default" as const,
  },
];

function AreaChart({ data }: { data: number[] }) {
  const width = 640;
  const height = 220;
  const pad = 8;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((value, i) => {
    const x = pad + i * stepX;
    const y =
      height - pad - ((value - min) / (max - min || 1)) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${points[points.length - 1][0]},${height} L${points[0][0]},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-56 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Monthly recurring revenue trend over the last 12 weeks"
    >
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#area-fill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="var(--color-accent)" />
      ))}
    </svg>
  );
}

const confidenceColor = {
  High: "success",
  Medium: "warning",
  Low: "danger",
} as const;

const toneColor = {
  success: "success",
  warning: "warning",
  danger: "danger",
  default: "default",
} as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Your workspace health for the last 12 weeks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/forecasts"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View forecasts
          </Link>
          <Link
            href="/dashboard/revenue"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            New report
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => {
          const positive = kpi.trend === "up";
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-start justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-secondary text-muted">
                  <kpi.icon className="size-[18px]" />
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    positive ? "text-success" : "text-danger"
                  }`}
                >
                  {positive ? (
                    <TrendUpIcon className="size-3.5" />
                  ) : (
                    <TrendDownIcon className="size-3.5" />
                  )}
                  {kpi.delta}
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                {kpi.value}
              </p>
              <p className="mt-1 text-sm text-muted">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Chart + forecasts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold">Recurring revenue</h2>
              <p className="mt-1 text-sm text-muted">Weekly MRR, USD</p>
            </div>
            <Chip color="success" variant="soft" size="sm">
              +54% YTD
            </Chip>
          </div>
          <div className="mt-4">
            <AreaChart data={SERIES} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>12 weeks ago</span>
            <span>This week</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Forecasts</h2>
            <Link
              href="/dashboard/forecasts"
              className="text-sm text-accent hover:underline"
            >
              All
            </Link>
          </div>
          <ul className="mt-4 flex flex-col divide-y divide-separator">
            {FORECASTS.map((f) => (
              <li
                key={f.metric}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{f.metric}</p>
                  <p className="text-xs text-muted">Next {f.horizon}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{f.projection}</p>
                  <Chip
                    color={confidenceColor[f.confidence as keyof typeof confidenceColor]}
                    variant="soft"
                    size="sm"
                  >
                    {f.confidence}
                  </Chip>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Activity table */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-muted">
              Account changes and detected anomalies.
            </p>
          </div>
          <Link
            href="/dashboard/customers"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Open customers
          </Link>
        </div>

        <div className="mt-4 -mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Event</th>
                <th className="py-2 pr-4 font-medium">Detail</th>
                <th className="py-2 pl-4 text-right font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {ACTIVITY.map((row) => (
                <tr key={row.customer} className="hover:bg-surface-secondary/60">
                  <td className="py-3 pr-4 font-medium">{row.customer}</td>
                  <td className="py-3 pr-4">
                    <Chip color={toneColor[row.tone]} variant="soft" size="sm">
                      {row.event}
                    </Chip>
                  </td>
                  <td className="py-3 pr-4 text-muted">{row.amount}</td>
                  <td className="py-3 pl-4 text-right text-muted">{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
