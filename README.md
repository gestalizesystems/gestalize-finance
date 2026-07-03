<p align="center">
  <img src="./banner1.png" alt="Gestalize Finance Banner" width="100%">
</p>

<h1 align="center">Gestalize Finance</h1>

<p align="center">
  Financial Management & Recurring Billing Platform
</p>

<p align="center">
  Manage customers, subscriptions, invoicing, recurring revenue and financial operations through a modern, centralized platform.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
</p>

<p align="center">
  Developed by <strong>Gestalize Systems</strong>
</p>

---

## Overview

Gestalize Finance is the platform Gestalize Systems uses to manage the financial
lifecycle of its client base. It consolidates revenue and cost tracking,
recurring subscription management, and automated billing into a single system,
replacing manual, spreadsheet-based processes.

## Business Problem

Businesses that sell software and services on a recurring basis accumulate
operational overhead as their client base grows. Invoicing, payment collection,
dunning, and reconciliation are often handled by hand across spreadsheets and
disconnected tools. The result is slow, error-prone, and offers limited
visibility into financial performance.

## Solution

Gestalize Finance centralizes the billing lifecycle in one application. From a
single record of clients, products, and subscriptions, it generates invoices on
schedule, notifies customers, provides a payment link, and reconciles payments
automatically. Revenue, costs, and financial indicators remain continuously up
to date.

## Key Features

- Financial dashboard with revenue, recurring revenue, average ticket, and
  delinquency indicators.
- Client management with per-client financial results.
- Product and service catalog with subscription and implementation pricing.
- Recurring subscriptions on monthly and annual cycles.
- Invoice generation, including combined implementation and subscription charges
  settled in a single payment.
- Automated dunning with pre-due and overdue notifications.
- Automatic payment reconciliation.
- Reporting by period with PDF export.
- Editable message templates for customer communication.
- Private access with optional two-factor authentication.
- Responsive interface for desktop, tablet, and mobile.

## Architecture Overview

Gestalize Finance is a single web application built on a server-first
architecture. Pages are rendered on the server, and write operations run through
server actions, avoiding a separate client-facing API for internal use. A small
set of endpoints supports external integrations and scheduled tasks.

A billing engine runs on a schedule to generate due invoices and update overdue
records. Payments are reconciled automatically through webhook notifications from
the payment provider. Integrations for payments, email, and messaging are
consumed over REST and isolated behind dedicated modules, each degrading
gracefully when a service is not configured.

## Technology Stack

- Next.js 14 (App Router, Server Components, Server Actions) with TypeScript
- Tailwind CSS
- PostgreSQL with Prisma ORM
- Recharts for data visualization
- REST integrations for payment, email, and messaging providers

## Project Structure

```
src/
  app/          Application routes and server actions
  components/    User interface components
  lib/           Business logic and integrations
prisma/          Data model and migrations
```

## Screenshots

Screenshots of the dashboard, billing, and reporting views will be published
here.

## Future Improvements

- Multi-user access with role-based permissions.
- Additional payment methods and installment options.
- Advanced reporting and data export.
- Audit logging for financial operations.

## License

Gestalize Finance is proprietary software developed and maintained by Gestalize
Systems. All rights reserved.
