import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders a screen inside the app shell and shows its menu", () => {
    render(
      <MemoryRouter initialEntries={["/for-you"]}>
        <App />
      </MemoryRouter>,
    );
    // getAllByText, not getByText: the page may repeat its menu item's text.
    expect(screen.getAllByText("For you").length).toBeGreaterThan(0);
  });
});
