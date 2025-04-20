import {  expect, describe, it, } from "vitest"
import { render,waitFor } from "@solidjs/testing-library"
import userEvent from "@testing-library/user-event"
import Counter from "./Counter"




describe("Counter", () => {
  it("renders", () => {
    const { getByRole } = render(() => <Counter />)
    const counter = getByRole('button')
    expect(counter).toBeInTheDocument()
  })

  it("has correct initial value", () => {
    const { getByRole } = render(() => <Counter />)
    const counter = getByRole('button')
    expect(counter).toHaveTextContent("Clicks: 0")
  })

    it("increments value on click", async () => {
        const user = userEvent.setup()
        const { getByRole } = render(() => <Counter />)
        const counter = getByRole('button')
        await user.click(counter)
        expect(counter).toHaveTextContent("Clicks: 1")
    })
})
