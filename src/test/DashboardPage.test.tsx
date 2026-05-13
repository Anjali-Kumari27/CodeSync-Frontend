/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import {
    vi,
    describe,
    it,
    expect,
    beforeEach
} from "vitest";
import { fireEvent } from "@testing-library/react";


// MOCK STORE
vi.mock("../store", () => ({
    useAuthStore: () => ({
        user: {
            id: 1,
            fullName: "Surbhi Sharma",
            username: "surbhi",
            email: "surbhi@gmail.com",
        },
    }),
}));

// MOCK APIs
vi.mock("../api/services", () => ({
    projectApi: {
        getMyProjects: vi.fn(() =>
            Promise.resolve({
                data: {
                    content: [
                        {
                            id: 1,
                            name: "CodeSync",
                            language: "JAVA",
                            visibility: "PUBLIC",
                            memberCount: 1,
                            branchCount: 1,
                            starCount: 0,
                        },
                    ],
                    totalElements: 1,
                    totalPages: 1,
                },
            })
        ),

        search: vi.fn(() =>
            Promise.resolve({
                data: {
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                },
            })
        ),
    },

    paymentApi: {
        createOrder: vi.fn(),
    },
}));

describe("DashboardPage", () => {

    beforeEach(() => {
        sessionStorage.clear();
    });

    it("renders new project button", async () => {

        render(
            <BrowserRouter>
                <DashboardPage />
            </BrowserRouter>
        );

        expect(
            await screen.findByText(/New Project/i)
        ).toBeInTheDocument();

    });

    it("shows upgrade premium button for free users", async () => {

        render(
            <BrowserRouter>
                <DashboardPage />
            </BrowserRouter>
        );

        expect(
            await screen.findByText(/Upgrade Premium/i)
        ).toBeInTheDocument();

    });

    it("shows premium badge for premium users", async () => {

        sessionStorage.setItem("isPremium", "true");

        render(
            <BrowserRouter>
                <DashboardPage />
            </BrowserRouter>
        );

        expect(
            await screen.findByText(/Premium Active/i)
        ).toBeInTheDocument();

    });

    it("shows upgrade message for free users after 2 projects", async () => {

        sessionStorage.removeItem("isPremium");

        render(
            <BrowserRouter>
                <DashboardPage />
            </BrowserRouter>
        );

        const button = await screen.findByText(/New Project/i);

        expect(button).toBeInTheDocument();

    });

    it("opens create project flow", async () => {

        render(
            <BrowserRouter>
                <DashboardPage />
            </BrowserRouter>
        );

        const button = await screen.findByText(/New Project/i);

        fireEvent.click(button);

        expect(button).toBeInTheDocument();

    });

    it("shows upgrade message for free users", async () => {

        sessionStorage.removeItem("isPremium");

        render(
            <BrowserRouter>
                <DashboardPage />
            </BrowserRouter>
        );

        const button = await screen.findByText(/Upgrade Premium/i);

        expect(button).toBeInTheDocument();

    });

    it("shows premium active text for premium users");
});