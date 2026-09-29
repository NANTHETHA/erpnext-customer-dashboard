// Express backend that acts as a proxy between the React app and ERPNext.
// The API key and secret stay on the server, so they are never exposed to the browser.
// const express = require("express");

const cors = require("cors");

// Loads FRAPPE_URL, FRAPPE_API_KEY and FRAPPE_API_SECRET from .env

require("dotenv").config();

 

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/test-auth", async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.FRAPPE_URL}/api/method/frappe.auth.get_logged_user`,
            {
                headers: {

                     // ERPNext token authentication: "token api_key:api_secret"
                    Authorization: `token ${process.env.FRAPPE_API_KEY}:${process.env.FRAPPE_API_SECRET}`,
                    Accept: "application/json"
                }
            }
        );

        const data = await response.json();

         // Pass ERPNext's status code and response straight through

        res.status(response.status).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to connect to ERPNext"
        });
    }
});

// Returns the list of customers (up to 100) for the dashboard table.

app.get("/api/customers", async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.FRAPPE_URL}/api/resource/Customer?limit_page_length=100`,
            {
                headers: {
                    Authorization: `token ${process.env.FRAPPE_API_KEY}:${process.env.FRAPPE_API_SECRET}`,
                    Accept: "application/json"
                }
            }
        );

        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch customers"
        });
    }
});

// Returns the full details of a single customer (used by the details modal).

app.get("/api/customers/:name", async (req, res) => {
    try {
        const customerName = encodeURIComponent(req.params.name);

        const response = await fetch(
            `${process.env.FRAPPE_URL}/api/resource/Customer/${customerName}`,
            {
                headers: {
                    Authorization: `token ${process.env.FRAPPE_API_KEY}:${process.env.FRAPPE_API_SECRET}`,
                    Accept: "application/json"
                }
            }
        );

        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to fetch customer details"
        });
    }
});


// Start the server

app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});