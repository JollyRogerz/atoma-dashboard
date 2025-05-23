This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

![CI](https://github.com/JollyRogerz/atoma-dashboard/actions/workflows/ci.yaml/badge.svg)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deployment Configuration

The application can be deployed using Docker Compose with configurable settings for different environments.

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

- `DASHBOARD_REPLICAS`: Number of service replicas to run

  - Set to `1` for development/testing environments (default)
  - Set to `3` or more for production environments requiring high availability
  - Example: `DASHBOARD_REPLICAS=3`

- `ACME_EMAIL`: Email address for Let's Encrypt SSL certificates
  - Required for SSL certificate generation
  - Example: `ACME_EMAIL=your-email@example.com`

### Docker Deployment

```bash
# Development deployment (1 replica)
docker-compose up -d

# Production deployment (3 replicas)
DASHBOARD_REPLICAS=3 docker-compose up -d
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
