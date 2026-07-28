import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountTeamAction } from
  "../app/account/_components/AccountTeamAction";

describe("account team action", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps the form reference across the invitation request", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetcher = vi.fn(async () =>
      Response.json(
        {
          id: "invitation:workos:invitation_test",
          status: "pending",
          expiresAt: 1_900_000_000_000,
        },
        { status: 201 },
      ));
    vi.stubGlobal("fetch", fetcher);
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(
      <AccountTeamAction
        href="/api/team/invitations"
        label="Invite a member"
        kind="invite-member"
      />,
    );
    const email = screen.getByRole("textbox", { name: "Member email" });
    await user.type(email, "support@kreydlabs.com");
    await user.click(screen.getByRole("button", { name: "Invite a member" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Invitation sent",
    );
    expect(email).toHaveValue("");
    expect(fetcher).toHaveBeenCalledWith(
      "/api/team/invitations",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
      }),
    );
  });
});
