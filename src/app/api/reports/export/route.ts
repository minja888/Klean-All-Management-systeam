// GET /api/reports/export?type=sales|expenses|profit&from=&to=
// Exports CSV (opens directly in Excel). ADMIN/ACCOUNTING only.
import { NextResponse } from "next/server";
import { handle, BadRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { computeProfit } from "@/lib/profit";

// Turn rows into a CSV string, quoting values safely.
function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
}

function csvResponse(filename: string, csv: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export const GET = handle(async (req) => {
  const session = await getSession();
  requireView(session, "profit_dashboard");

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "sales";
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const now = new Date();
  const from = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam + "T23:59:59") : now;

  if (type === "sales") {
    const sales = await prisma.sale.findMany({
      where: { saleDate: { gte: from, lte: to } },
      include: { customer: { select: { name: true } } },
      orderBy: { saleDate: "desc" },
    });
    const csv = toCsv(
      ["Sale", "Date", "Customer", "Total", "Paid", "Debt"],
      sales.map((s) => [
        s.saleNumber,
        s.saleDate.toISOString().slice(0, 10),
        s.customer?.name ?? "Walk-in",
        toNumber(s.totalAmount),
        toNumber(s.amountPaid),
        toNumber(s.totalAmount) - toNumber(s.amountPaid),
      ]),
    );
    return csvResponse("sales.csv", csv);
  }

  if (type === "expenses") {
    const expenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: from, lte: to } },
      include: { category: { select: { name: true } }, department: { select: { name: true } } },
      orderBy: { expenseDate: "desc" },
    });
    const csv = toCsv(
      ["Date", "Category", "Description", "Department", "Amount"],
      expenses.map((e) => [
        e.expenseDate.toISOString().slice(0, 10),
        e.category?.name ?? "",
        e.description ?? "",
        e.department?.name ?? "",
        toNumber(e.amount),
      ]),
    );
    return csvResponse("expenses.csv", csv);
  }

  if (type === "profit") {
    const p = await computeProfit(from, to);
    const csv = toCsv(
      ["Metric", "Amount (TZS)"],
      [
        ["Revenue", p.revenue],
        ["COGS", p.cogs],
        ["Gross Profit", p.grossProfit],
        ["Expenses", p.expenses],
        ["Payroll", p.payroll],
        ["Operating Cost", p.operatingCost],
        ["Net Profit", p.netProfit],
      ],
    );
    return csvResponse("profit.csv", csv);
  }

  throw BadRequest("Unknown report type");
});
