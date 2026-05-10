export interface Category {
  id: string;
  name: string;
  icon: string;
  iconLibrary: "Feather" | "Ionicons" | "MaterialIcons" | "MaterialCommunityIcons";
  color: string;
  bgColor: string;
}

export interface Service {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  rating: number;
  reviewCount: number;
  popular?: boolean;
  includes: string[];
}

export interface Provider {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  specializations: string[];
  pricePerHour: number;
  verified: boolean;
  completedJobs: number;
  initials: string;
  color: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  providerId?: string;
  providerName?: string;
  date: string;
  time: string;
  address: string;
  status: "upcoming" | "in_progress" | "completed" | "cancelled";
  totalPrice: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: string[];
  role?: "client" | "worker";
  workerProviderId?: string | null;
}
