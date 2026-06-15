import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ItemLayout from "./items.$itemId";

describe("item layout route", () => {
  it("renders nested child routes through an outlet", () => {
    render(
      <MemoryRouter initialEntries={["/items/item-1/edit"]}>
        <Routes>
          <Route path="/items/:itemId" element={<ItemLayout />}>
            <Route path="edit" element={<p>Edit child route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Edit child route")).toBeInTheDocument();
  });
});
