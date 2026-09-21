import { AxiosError, AxiosHeaders } from "axios";

import { toApiError } from "@/services/http/apiError";

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders();

  return new AxiosError("Request failed", "ERR_BAD_REQUEST", { headers }, null, {
    status,
    statusText: "",
    headers: {},
    config: { headers },
    data,
  });
}

describe("toApiError", () => {
  it("maps a Problem Details document, keeping one message per field", () => {
    const error = toApiError(
      axiosErrorWith(422, {
        type: "about:blank",
        title: "Unprocessable Content",
        status: 422,
        code: "validation_failed",
        detail: "The request contains invalid data.",
        violations: [
          { field: "email", message: "This value is not a valid email address." },
          { field: "email", message: "This value is too long." },
          { field: "name", message: "This value should not be blank." },
        ],
      }),
    );

    expect(error).toEqual({
      status: 422,
      code: "validation_failed",
      message: "The request contains invalid data.",
      fieldErrors: {
        email: "This value is not a valid email address.",
        name: "This value should not be blank.",
      },
    });
  });

  it("reports an unreachable server", () => {
    const error = toApiError(new AxiosError("Network Error", "ERR_NETWORK"));

    expect(error.status).toBe(0);
    expect(error.code).toBe("network_error");
  });

  it("reports an unexpected answer", () => {
    expect(toApiError(axiosErrorWith(502, "<html>Bad gateway</html>")).code).toBe("http_error");
    expect(toApiError(new Error("boom")).code).toBe("unknown_error");
  });
});
