import type { Metadata } from 'next';
import LandingClient from '../components/landing/LandingClient';

export const metadata: Metadata = {
  title: 'FoodLink — Smart Food Redistribution Platform',
  description:
    'Connect surplus food from hotels & restaurants to NGOs and volunteers. Reduce food waste, fight hunger, build community.',
};

export default function HomePage() {
  return <LandingClient />;
}
