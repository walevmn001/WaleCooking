import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormField } from "@/components/forms/form-field";
import { Input, Textarea } from "@/components/forms/input";
import { Select } from "@/components/forms/select";
import { Checkbox } from "@/components/forms/checkbox";
import { Radio, RadioGroup } from "@/components/forms/radio";
import { Switch } from "@/components/forms/switch";

describe("FormField + Input (accessibility)", () => {
  it("gắn label với control qua htmlFor/id", () => {
    render(
      <FormField label="Tiêu đề">
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText("Tiêu đề")).toBeInstanceOf(HTMLInputElement);
  });

  it("đánh dấu required (có ghi chú cho screen reader)", () => {
    render(
      <FormField label="Email" required>
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-required", "true");
    expect(screen.getByText(/bắt buộc/)).toBeInTheDocument();
  });

  it("lỗi: aria-invalid + nối aria-describedby tới thông báo lỗi (role=alert)", () => {
    render(
      <FormField label="Email" error="Email không hợp lệ">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const errorEl = screen.getByRole("alert");
    expect(errorEl).toHaveTextContent("Email không hợp lệ");
    expect(input.getAttribute("aria-describedby")).toContain(errorEl.id);
  });

  it("khi có lỗi thì ẩn hint; khi không có lỗi thì hiện hint", () => {
    const { rerender } = render(
      <FormField label="A" hint="Gợi ý A">
        <Input />
      </FormField>,
    );
    expect(screen.getByText("Gợi ý A")).toBeInTheDocument();

    rerender(
      <FormField label="A" hint="Gợi ý A" error="Lỗi A">
        <Input />
      </FormField>,
    );
    expect(screen.queryByText("Gợi ý A")).not.toBeInTheDocument();
  });

  it("disabled lan truyền từ FormField xuống control", () => {
    render(
      <FormField label="Khoá" disabled>
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText("Khoá")).toBeDisabled();
  });

  it("Textarea cũng nhận label/aria từ FormField", () => {
    render(
      <FormField label="Mô tả" error="Thiếu mô tả">
        <Textarea />
      </FormField>,
    );
    expect(screen.getByLabelText("Mô tả")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Select", () => {
  it("render options và gắn label", () => {
    render(
      <FormField label="Khẩu phần">
        <Select
          options={[
            { value: "2", label: "2 người" },
            { value: "4", label: "4 người" },
          ]}
        />
      </FormField>,
    );
    const select = screen.getByLabelText("Khẩu phần");
    expect(select).toBeInstanceOf(HTMLSelectElement);
    expect(screen.getByRole("option", { name: "4 người" })).toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("gắn nhãn và toggle khi bấm", () => {
    render(<Checkbox label="Đồng ý" />);
    const box = screen.getByLabelText("Đồng ý");
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(box).toBeChecked();
  });

  it("invalid: đặt aria-invalid", () => {
    render(<Checkbox label="Lỗi" invalid />);
    expect(screen.getByLabelText("Lỗi")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("RadioGroup", () => {
  it("dùng fieldset/legend và cho phép chọn một", () => {
    render(
      <RadioGroup legend="Độ khó">
        <Radio value="easy" label="Dễ" />
        <Radio value="hard" label="Khó" />
      </RadioGroup>,
    );
    expect(screen.getByRole("group", { name: "Độ khó" })).toBeInTheDocument();
    const hard = screen.getByLabelText("Khó");
    fireEvent.click(hard);
    expect(hard).toBeChecked();
  });
});

describe("Switch", () => {
  it("role=switch + aria-checked phản ánh trạng thái", () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch checked={false} onCheckedChange={onCheckedChange} label="Đi chợ" />,
    );
    const sw = screen.getByRole("switch", { name: "Đi chợ" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
