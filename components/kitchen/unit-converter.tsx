"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/forms/input";
import { Select } from "@/components/forms/select";
import {
  convertUnit,
  formatConvertedValue,
  getUnit,
  parseAmountInput,
  unitsByDimension,
  type UnitDimension,
} from "@/lib/kitchen/units";

const DIMENSIONS: { value: UnitDimension; label: string }[] = [
  { value: "mass", label: "Khối lượng" },
  { value: "volume", label: "Thể tích" },
  { value: "temperature", label: "Nhiệt độ" },
];

function defaultUnits(dimension: UnitDimension): [string, string] {
  const list = unitsByDimension(dimension);
  return [list[0]?.code ?? "", list[1]?.code ?? list[0]?.code ?? ""];
}

/**
 * UnitConverter — công cụ quy đổi đơn vị đo (P10.2). Logic tách riêng ở `lib/kitchen/units`.
 * Chỉ quy đổi trong CÙNG nhóm đại lượng (khối lượng/thể tích/nhiệt độ) theo hệ số xác định;
 * KHÔNG quy đổi khối lượng ↔ thể tích, KHÔNG gộp đơn vị đếm.
 */
export function UnitConverter({ className }: { className?: string }) {
  const [dimension, setDimension] = useState<UnitDimension>("mass");
  const [fromCode, setFromCode] = useState(() => defaultUnits("mass")[0]);
  const [toCode, setToCode] = useState(() => defaultUnits("mass")[1]);
  const [amount, setAmount] = useState("");

  const options = useMemo(
    () => unitsByDimension(dimension).map((u) => ({ value: u.code, label: `${u.name} (${u.symbol})` })),
    [dimension],
  );

  const from = getUnit(fromCode);
  const to = getUnit(toCode);

  const parsed = parseAmountInput(amount);
  const result = parsed == null ? null : convertUnit(parsed, fromCode, toCode);

  const changeDimension = (next: UnitDimension) => {
    const [f, t] = defaultUnits(next);
    setDimension(next);
    setFromCode(f);
    setToCode(t);
  };

  const swap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const sourceNote = [from?.source, to?.source].filter(Boolean).join(" · ");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as="h2">Quy đổi đơn vị</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-5">
        <div role="group" aria-label="Nhóm đơn vị" className="flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => (
            <Chip
              key={d.value}
              variant="brand"
              selected={dimension === d.value}
              onClick={() => changeDimension(d.value)}
            >
              {d.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="unit-amount" className="text-body-sm font-semibold text-ink">
            Giá trị
          </label>
          <Input
            id="unit-amount"
            inputMode="decimal"
            value={amount}
            placeholder="Nhập số, ví dụ 250"
            onChange={(e) => setAmount(e.target.value)}
            invalid={amount.trim() !== "" && parsed == null}
          />
        </div>

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col gap-2">
            <label htmlFor="unit-from" className="text-body-sm font-semibold text-ink">
              Từ
            </label>
            <Select
              id="unit-from"
              value={fromCode}
              options={options}
              onChange={(e) => setFromCode(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={swap}
            aria-label="Đổi chiều quy đổi"
            className="justify-self-start sm:justify-self-center"
            leftIcon={<ArrowLeftRight className="size-4" aria-hidden="true" />}
          >
            Đổi
          </Button>
          <div className="flex flex-col gap-2">
            <label htmlFor="unit-to" className="text-body-sm font-semibold text-ink">
              Sang
            </label>
            <Select
              id="unit-to"
              value={toCode}
              options={options}
              onChange={(e) => setToCode(e.target.value)}
            />
          </div>
        </div>

        {/* Kết quả */}
        <div aria-live="polite" className="rounded-lg border border-line-subtle bg-surface-muted p-4">
          {amount.trim() === "" ? (
            <p className="text-body text-ink-muted">Nhập giá trị để xem kết quả quy đổi.</p>
          ) : parsed == null ? (
            <p className="text-body font-semibold text-danger">
              Vui lòng nhập một số hợp lệ.
            </p>
          ) : result && result.ok ? (
            <p className="text-body-lg text-ink">
              <span className="font-semibold">
                {formatConvertedValue(parsed)} {from?.symbol}
              </span>{" "}
              ={" "}
              <span className="font-heading text-h3 font-bold text-primary">
                {formatConvertedValue(result.value)} {result.to.symbol}
              </span>
            </p>
          ) : (
            <p className="text-body font-semibold text-danger">
              {result && !result.ok ? result.message : "Không thể quy đổi."}
            </p>
          )}
        </div>

        {sourceNote ? (
          <p className="text-caption text-ink-subtle">
            Hệ số quy đổi theo: {sourceNote}.
          </p>
        ) : null}

        <p className="text-caption text-ink-subtle">
          Công cụ chỉ quy đổi trong cùng nhóm đại lượng. Không quy đổi khối lượng sang thể tích
          (thiếu tỷ trọng), không quy đổi giữa các đơn vị đếm (cái, quả, miếng, chén…).
        </p>
      </CardBody>
    </Card>
  );
}
