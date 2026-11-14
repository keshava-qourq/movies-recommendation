import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUpload from "./AdminUpload";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: vi.fn(),
}));
const apiFetch = vi.mocked(api.apiFetch);

async function pick(name: string) {
  const user = userEvent.setup({ applyAccept: false });
  render(<AdminUpload />);
  const file = new File(["title,year\n"], name, { type: "text/csv" });
  await user.upload(screen.getByLabelText("CSV file"), file);
  await user.click(screen.getByRole("button", { name: /Upload/ }));
}

beforeEach(() => apiFetch.mockReset());

describe("AdminUpload", () => {
  it("[AC-054] shows an empty state before any upload", () => {
    render(<AdminUpload />);
    expect(screen.getAllByText("No upload yet").length).toBeGreaterThan(0);
  });

  it("[AC-053] [AC-054] [AC-058] sends the file and shows counts and rows", async () => {
    apiFetch.mockResolvedValueOnce({
      added: 2,
      skipped: [{ row: 3, title: "Heat", reason: "Already in the catalog" }],
      rejected: [{ row: 2, title: "", reason: "Title is empty" }],
    });
    await pick("m.csv");
    expect(await screen.findByText(/2 movies added/)).toBeInTheDocument();
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("/admin/movies/upload");
    expect((init!.body as FormData).get("file")).toBeInstanceOf(File);
    expect(screen.getByRole("group", { name: "Added: 2" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Skipped as duplicates: 1" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Rejected: 1" })).toBeInTheDocument();
    expect(screen.getByText("Already in the catalog")).toBeInTheDocument();
    expect(screen.getByText("Title is empty")).toBeInTheDocument();
  });

  it("[AC-056] shows the server detail on a 400", async () => {
    apiFetch.mockRejectedValueOnce(new api.ApiError(400, "Missing column: year"));
    await pick("m.csv");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Missing column: year Nothing was added.",
    );
  });

  it("[AC-056] refuses a non-.csv file before any request", async () => {
    await pick("m.txt");
    expect(await screen.findByRole("alert")).toHaveTextContent("Nothing was added");
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
